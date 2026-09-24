import { createSignal, For, onCleanup, Show } from "solid-js";
import { Dropdown } from "../../settings/components/Dropdown.jsx";
import { SegmentedControl } from "../../settings/components/SegmentedControl.jsx";
import classes from "./ScreensharePicker.module.css";
import { type IPCSources, SourceCard } from "./SourceCard.jsx";

const {
    ui: {
        ModalRoot,
        ModalBody,
        ModalConfirmFooter,
        ModalSizes,
        ModalHeader,
        Header,
        HeaderTags,
        Divider,
        Checkbox,
        showToast,
    },
    plugin: { store },
} = shelter;

export const ScreensharePicker = (props: {
    close: () => void;
    sources: IPCSources[];
}) => {
    const [source, setSource] = createSignal("none");
    const [name, setName] = createSignal("nothing...");
    const [audio, setAudio] = createSignal(false);
    if (props.sources.length === 1) {
        setSource(props.sources[0].id);
        setName(props.sources[0].name);
    }

    const t = store.i18n;
    function startScreenshare() {
        if (source() === "") {
            showToast(t["screenshare-selectSource"], "error");
        }
        window.legcord.screenshare.start(source(), name(), audio());

        props.close();
    }

    function closeAndSave() {
        window.legcord.screenshare.start("none", "", false);
        props.close();
    }

    onCleanup(closeAndSave);

    return (
        <ModalRoot size={ModalSizes.MEDIUM} style="max-height: 90vh;">
            <ModalHeader close={closeAndSave}>{t["screenshare-title"]}</ModalHeader>
            <ModalBody>
                <div class={classes.sources}>
                    <For each={props.sources}>
                        {(source: IPCSources) => (
                            <SourceCard
                                selected_name={name}
                                source={source}
                                onSelect={(srcId, name) => {
                                    setSource(srcId);
                                    setName(name);
                                }}
                            />
                        )}
                    </For>
                </div>
                <div class={classes.settingsSection}>
                    <div class={classes.selectedBanner}>
                        <svg class={classes.selectedIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <title>Monitor</title>
                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" />
                            <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <span class={classes.selectedLabel}>Sharing:</span>
                        <span class={classes.selectedName}>{name()}</span>
                    </div>
                    <div class={classes.qualityBox}>
                        <div class={classes.controlGroup}>
                            <Header class={classes.header} tag={HeaderTags.H4}>
                                Resolution
                            </Header>
                            <SegmentedControl
                                value={store.resolution}
                                onChange={(v) => {
                                    store.resolution = Number(v);
                                }}
                                options={[
                                    { label: "480p", value: "480" },
                                    { label: "720p", value: "720" },
                                    { label: "1080p", value: "1080" },
                                    { label: "1440p", value: "1440" },
                                    { label: "2160p", value: "2160" },
                                ]}
                            />
                        </div>
                        <div class={classes.controlGroup}>
                            <Header class={classes.header} tag={HeaderTags.H4}>
                                FPS
                            </Header>
                            <SegmentedControl
                                value={store.fps}
                                onChange={(v) => {
                                    store.fps = Number(v);
                                }}
                                options={[
                                    { label: "5", value: "5" },
                                    { label: "15", value: "15" },
                                    { label: "30", value: "30" },
                                    { label: "60", value: "60" },
                                ]}
                            />
                        </div>
                    </div>
                    <div class={classes.audioRow} style="margin-top: 12px;">
                        <div class={classes.audioLabel}>
                            <svg class={classes.audioIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <title>Audio</title>
                                <path
                                    d="M11 5L6 9H2v6h4l5 4V5z"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                                <path
                                    d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            Share Audio
                        </div>
                        <Checkbox checked={audio()} onChange={setAudio} />
                    </div>
                </div>
            </ModalBody>
            <ModalConfirmFooter
                confirmText={t["screenshare-share"]}
                onConfirm={startScreenshare}
                close={closeAndSave}
            />
        </ModalRoot>
    );
};
