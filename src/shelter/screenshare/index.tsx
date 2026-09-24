import { ScreensharePicker } from "./components/ScreensharePicker.jsx";
import type { IPCSources } from "./components/SourceCard.jsx";

const {
    util: { log },
    flux: {
        stores: { UserStore, MediaEngineStore },
        dispatcher,
        intercept,
    },
    ui: { openModal },
    plugin: { store },
} = shelter;

store.fps ??= 30; // set default
store.resolution ??= 1080; // 1080p is a safer default than 2K on integrated GPUs

const BITRATE_CEILING = 25_000_000;
const REAPPLY_DELAYS_MS = [1000, 3000, 8000] as const;

/** Discord-like Go Live targets (bits/s) by height and fps band. */
function targetBitrateFor(height: number, fps: number): number {
    const highFps = fps > 30;
    const table: Record<number, [number, number]> = {
        480: [2_500_000, 3_500_000],
        720: [4_000_000, 6_000_000],
        1080: [8_000_000, 10_000_000],
        1440: [12_000_000, 15_000_000],
        2160: [18_000_000, 25_000_000],
    };
    const nearest = Object.keys(table)
        .map(Number)
        .sort((a, b) => Math.abs(a - height) - Math.abs(b - height))[0];
    const [low, high] = table[nearest] ?? [4_000_000, 6_000_000];
    return Math.min(highFps ? high : low, BITRATE_CEILING);
}

type StreamConnection = {
    pc?: RTCPeerConnection;
    peerConnection?: RTCPeerConnection;
    _pc?: RTCPeerConnection;
    streamUserId?: string;
    videoStreamParameters?: Array<{
        maxFrameRate?: number;
        maxResolution?: { type: string; width: number; height: number };
        maxPixelCount?: number;
        maxBitrate?: number;
    }>;
    videoQualityManager?: {
        goliveMaxQuality?: {
            bitrateMin?: number;
            bitrateMax?: number;
            bitrateTarget?: number;
        };
    };
};

let loggedEncoderForCurrentStream = false;
let reapplyTimers: ReturnType<typeof setTimeout>[] = [];
let reapplyGeneration = 0;

function clearReapplyTimers(): void {
    for (const t of reapplyTimers) clearTimeout(t);
    reapplyTimers = [];
    reapplyGeneration++;
}

function getLocalStreamConnection(): StreamConnection | undefined {
    // @ts-expect-error Discord MediaEngine typings
    const mediaConnections = [...MediaEngineStore.getMediaEngine().connections] as StreamConnection[];
    // @ts-expect-error Discord UserStore typings
    const currentUserId = UserStore.getCurrentUser().id as string;
    return mediaConnections.find((connection) => connection.streamUserId === currentUserId);
}

function getOutboundVideoSender(streamConnection: StreamConnection): RTCRtpSender | undefined {
    const pc = streamConnection.pc ?? streamConnection.peerConnection ?? streamConnection._pc;
    return pc?.getSenders?.().find((s) => s.track?.kind === "video");
}

/** Prefer H.264 profiles that map to platform HW encode (not OpenH264 CBP). */
function preferPlatformHwH264(streamConnection: StreamConnection): void {
    const platform = window.legcord.platform;
    if (platform !== "darwin" && platform !== "win32") return;
    try {
        const sender = getOutboundVideoSender(streamConnection);
        if (!sender?.setCodecPreferences || typeof RTCRtpSender.getCapabilities !== "function") return;

        const caps = RTCRtpSender.getCapabilities("video");
        if (!caps?.codecs?.length) return;

        const rank = (codec: RTCRtpCodec) => {
            const mime = codec.mimeType.toLowerCase();
            const fmtp = (codec.sdpFmtpLine ?? "").toLowerCase();
            if (!mime.includes("h264")) {
                if (mime.includes("vp9")) return 10;
                if (mime.includes("vp8")) return 11;
                return 20;
            }
            // Avoid Constrained Baseline → OpenH264 software path
            if (/profile-level-id=42e0/.test(fmtp)) return 5;
            // Baseline / Main / High → VideoToolbox (macOS) or Media Foundation (Windows)
            if (/profile-level-id=4200/.test(fmtp)) return 0;
            if (/profile-level-id=4d00/.test(fmtp)) return 1;
            if (/profile-level-id=6400/.test(fmtp)) return 2;
            return 3;
        };

        const preferred = [...caps.codecs].sort((a, b) => rank(a) - rank(b));
        sender.setCodecPreferences(preferred);
        const backend = platform === "darwin" ? "VideoToolbox" : "MediaFoundation";
        log(
            `Preferred ${backend} H264 codecs: ${preferred
                .slice(0, 6)
                .map((c) => `${c.mimeType}${c.sdpFmtpLine ? ` (${c.sdpFmtpLine})` : ""}`)
                .join(", ")}`,
        );
    } catch (e) {
        console.warn("[Screenshare] Failed to prefer platform HW H264:", e);
    }
}

function formatMbps(bps: number | undefined | null): string {
    if (bps == null || Number.isNaN(bps)) return "?";
    return `${(bps / 1_000_000).toFixed(1)}Mbps`;
}

/** Cap RTP framerate / bitrate ceiling without forcing scale (Discord adapts spatial layers). */
async function applySenderEncodeLimits(
    streamConnection: StreamConnection,
    _height: number,
    fps: number,
    maxBitrate: number,
): Promise<void> {
    try {
        const sender = getOutboundVideoSender(streamConnection);
        if (!sender?.getParameters || !sender.setParameters) return;

        const params = sender.getParameters();
        if (!params.encodings?.length) {
            params.encodings = [{}];
        }

        const before = params.encodings.map((e) => e.maxBitrate);
        for (const encoding of params.encodings) {
            // Raise whenever Discord/Chromium left a lower ceiling — never fight intentional
            // downscales by forcing scaleResolutionDownBy.
            const current = encoding.maxBitrate;
            if (current == null || current < maxBitrate) {
                encoding.maxBitrate = maxBitrate;
            }
            encoding.maxFramerate = fps;
        }

        await sender.setParameters(params);
        const after = sender.getParameters().encodings?.map((e) => e.maxBitrate) ?? [];
        log(
            `Applied RTP sender limits: maxBitrate ${before.map(formatMbps).join(",")} → ${after.map(formatMbps).join(",")} (ceiling ${formatMbps(maxBitrate)}) maxFramerate=${fps}`,
        );
    } catch (e) {
        console.warn("[Screenshare] Failed to apply RTP sender encode limits:", e);
    }
}

async function logEncoderImplementation(streamConnection: StreamConnection): Promise<void> {
    try {
        const sender = getOutboundVideoSender(streamConnection);
        if (!sender?.getStats) return;

        // Encoder stats appear shortly after the stream starts
        await new Promise((r) => setTimeout(r, 1500));

        // Connection may have been replaced; prefer a fresh local stream handle
        const live = getLocalStreamConnection() ?? streamConnection;
        const liveSender = getOutboundVideoSender(live) ?? sender;

        const encodingParams = liveSender.getParameters?.().encodings?.[0];
        const golive = live.videoQualityManager?.goliveMaxQuality;

        const stats = await liveSender.getStats();
        let availableOutgoingBitrate: number | undefined;
        for (const report of stats.values()) {
            if (report.type === "candidate-pair" && "availableOutgoingBitrate" in report) {
                const nominated = "nominated" in report ? Boolean(report.nominated) : false;
                const state = "state" in report ? String(report.state) : "";
                if (nominated || state === "succeeded") {
                    availableOutgoingBitrate = Number(report.availableOutgoingBitrate);
                    if (nominated) break;
                }
            }
        }

        for (const report of stats.values()) {
            if (report.type !== "outbound-rtp" || report.kind !== "video") continue;
            const impl = "encoderImplementation" in report ? String(report.encoderImplementation) : "unknown";
            const mime = "mimeType" in report ? String(report.mimeType) : "unknown";
            const scale =
                "scalabilityMode" in report
                    ? String(report.scalabilityMode)
                    : "frameWidth" in report && "frameHeight" in report
                      ? `${report.frameWidth}x${report.frameHeight}`
                      : "";
            const targetBitrate = "targetBitrate" in report ? Number(report.targetBitrate) : undefined;
            const qualityLimitationReason =
                "qualityLimitationReason" in report ? String(report.qualityLimitationReason) : "?";
            const qualityLimitationDurations =
                "qualityLimitationDurations" in report && report.qualityLimitationDurations
                    ? JSON.stringify(report.qualityLimitationDurations)
                    : "?";

            log(
                [
                    `Screenshare encoder: implementation=${impl} codec=${mime} ${scale}`.trim(),
                    `targetBitrate=${formatMbps(targetBitrate)}`,
                    `availableOutgoingBitrate=${formatMbps(availableOutgoingBitrate)}`,
                    `qualityLimitationReason=${qualityLimitationReason}`,
                    `qualityLimitationDurations=${qualityLimitationDurations}`,
                    `encoding.maxBitrate=${formatMbps(encodingParams?.maxBitrate)}`,
                    `encoding.maxFramerate=${encodingParams?.maxFramerate ?? "?"}`,
                    `goliveMaxQuality min/target/max=${formatMbps(golive?.bitrateMin)}/${formatMbps(golive?.bitrateTarget)}/${formatMbps(golive?.bitrateMax)}`,
                ].join(" | "),
            );
            return;
        }
        log("Screenshare encoder: no outbound-rtp video stats yet");
    } catch (e) {
        console.warn("[Screenshare] Failed to read encoder stats:", e);
    }
}

function patchStreamQuality(reason: string): boolean {
    const streamConnection = getLocalStreamConnection();
    if (!streamConnection) return false;

    const width = Math.round(store.resolution * (16 / 9));
    const height = store.resolution;
    const targetBitrate = targetBitrateFor(height, store.fps);
    const bitrateMin = Math.round(targetBitrate * 0.8);
    const bitrateMax = Math.min(Math.round(targetBitrate * 1.2), BITRATE_CEILING);

    const params = streamConnection.videoStreamParameters?.[0];
    if (params) {
        params.maxFrameRate = store.fps;
        params.maxResolution = { type: "fixed", width, height };
        params.maxPixelCount = width * height;
        params.maxBitrate = bitrateMax;
    }

    const golive = streamConnection.videoQualityManager?.goliveMaxQuality;
    if (golive) {
        golive.bitrateMin = bitrateMin;
        golive.bitrateMax = bitrateMax;
        golive.bitrateTarget = targetBitrate;
    }

    void applySenderEncodeLimits(streamConnection, height, store.fps, bitrateMax);
    preferPlatformHwH264(streamConnection);

    log(
        `Patched current user's stream (${reason}) with resolution: (${width}x${height}) ${store.fps}FPS @ ${formatMbps(targetBitrate)} (min ${formatMbps(bitrateMin)} / max ${formatMbps(bitrateMax)}).`,
    );
    return true;
}

function scheduleStreamQualityReapplies(): void {
    clearReapplyTimers();
    const generation = reapplyGeneration;
    for (const delay of REAPPLY_DELAYS_MS) {
        const timer = setTimeout(() => {
            if (generation !== reapplyGeneration) return;
            if (!getLocalStreamConnection()) return;
            patchStreamQuality(`reapply@${delay}ms`);
        }, delay);
        reapplyTimers.push(timer);
    }
}

function onStreamQualityChange() {
    if (!patchStreamQuality("quality-changed")) return;

    scheduleStreamQualityReapplies();

    if (!loggedEncoderForCurrentStream) {
        loggedEncoderForCurrentStream = true;
        const streamConnection = getLocalStreamConnection();
        if (streamConnection) void logEncoderImplementation(streamConnection);
    }
}

interface StreamDispatch {
    streamKey?: string;
    reason?: string;
}
function onStreamEnd(dispatch: StreamDispatch) {
    if (!dispatch.streamKey) return;
    const owner = dispatch.streamKey.split(":").at(-1);
    // @ts-expect-error Discord UserStore typings
    const currentUserId = UserStore.getCurrentUser().id as string;
    if (owner === currentUserId) {
        loggedEncoderForCurrentStream = false;
        clearReapplyTimers();
    }
}

export function onLoad() {
    log("Legcord Screenshare Module");
    store.i18n = window.legcord.translations;
    window.legcord.screenshare.getSources((_event: Event, sources: IPCSources[]) => {
        openModal(({ close }: { close: () => void }) => <ScreensharePicker sources={sources} close={close} />);
    });
    intercept((dispatch) => {
        if (dispatch.type === "MEDIA_ENGINE_SET_GO_LIVE_SOURCE") {
            console.log("Intercepted stream quality change dispatch", dispatch);
            dispatch.settings.qualityOptions = {
                frameRate: store.fps,
                resolution: store.resolution,
                preset: 3,
            };
            return dispatch;
        }
    });
    dispatcher.subscribe("MEDIA_ENGINE_VIDEO_SOURCE_QUALITY_CHANGED", onStreamQualityChange);
    dispatcher.subscribe("STREAM_DELETE", onStreamEnd);
}

export function onUnload() {
    clearReapplyTimers();
    dispatcher.unsubscribe("MEDIA_ENGINE_VIDEO_SOURCE_QUALITY_CHANGED", onStreamQualityChange);
    dispatcher.unsubscribe("STREAM_DELETE", onStreamEnd);
}
