import { Button, ButtonColors, ButtonSizes, injectInternalStyles, niceScrollbarsClass } from "@uwu/shelter-ui";
import { type Accessor, createMemo, createResource, createSignal, For, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import { Motion } from "solid-motionone";

injectInternalStyles();

type Lang = Record<string, string> | undefined;

const ctaStyle = {
    "--shltr-btn-w": "280px",
    "--shltr-btn-h": "44px",
    "font-size": "16px",
    "line-height": "20px",
    padding: "2px 24px",
} as const;

const footerBtnStyle = {
    "--shltr-btn-w": "96px",
    "--shltr-btn-h": "38px",
} as const;

const WarningIcon = () => (
    <svg class="setup-warning-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 14.25a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 16.25Zm1.1-3.75h-2.2l-.35-6h2.9Z" />
    </svg>
);

const OptionCard = (props: {
    selected: boolean;
    onSelect: () => void;
    title: string;
    description: string;
    badge?: string;
    preview?: string;
    icon?: string;
}) => (
    <button
        type="button"
        class="setup-option"
        classList={{ "setup-option--selected": props.selected }}
        onClick={props.onSelect}
        aria-pressed={props.selected}
    >
        <Show when={props.preview}>
            <div class="setup-option-preview">
                <img src={props.preview} alt="" />
            </div>
        </Show>
        <Show when={props.icon}>
            <div class="setup-option-icon" classList={{ "setup-option-icon--selected": props.selected }}>
                <img src={props.icon} alt="" />
            </div>
        </Show>
        <div class="setup-option-content">
            <div class="setup-option-title-row">
                <span class="setup-option-title">{props.title}</span>
                <Show when={props.badge}>
                    <span class="setup-badge">{props.badge}</span>
                </Show>
            </div>
            <span class="setup-option-desc">{props.description}</span>
        </div>
        <span class="setup-radio" classList={{ "setup-radio--selected": props.selected }} aria-hidden="true">
            <Show when={props.selected}>
                <span class="setup-radio-dot" />
            </Show>
        </span>
    </button>
);

const Progress = (props: { current: number; total: number }) => (
    <div class="setup-progress" aria-hidden="true">
        <For each={Array.from({ length: props.total }, (_, i) => i)}>
            {(i) => (
                <div
                    class="setup-progress-segment"
                    classList={{
                        "setup-progress-segment--done": i < props.current,
                        "setup-progress-segment--active": i === props.current,
                    }}
                />
            )}
        </For>
    </div>
);

const Welcome = ({ onNext, t }: { onNext: () => void; t: () => Lang }) => (
    <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} class="setup-welcome">
        <img class="setup-logo" src="legcord://assets/desktop.png" alt="" />
        <h1 class="setup-title setup-title--hero">{t()?.["setup-welcomeTitle"] ?? "Welcome to Cordium"}</h1>
        <p class="setup-subtitle setup-subtitle--hero">
            {t()?.["setup-welcomeSubtitle"] ?? "Let's get you set up with your perfect configuration."}
        </p>
        <Button
            color={ButtonColors.PRIMARY}
            size={ButtonSizes.LARGE}
            onClick={onNext}
            class="setup-cta"
            style={ctaStyle}
        >
            {t()?.["setup-getStarted"] ?? "Get Started"}
        </Button>
    </Motion.div>
);

const WindowStyle = ({
    selectedStyle,
    onSelect,
    t,
}: {
    selectedStyle: Accessor<string>;
    onSelect: (styleId: string) => void;
    t: () => Lang;
}) => {
    const styles = [
        {
            id: "overlay",
            titleKey: "setup-windowStyle-overlayTitle",
            titleFallback: "Overlay Titlebar",
            descKey: "setup-windowStyle-overlayDesc",
            descFallback: "A modern titlebar that blends into Discord.",
            screenshot: "legcord://assets/overlay.png",
        },
        {
            id: "native",
            titleKey: "setup-windowStyle-nativeTitle",
            titleFallback: "Native Window",
            descKey: "setup-windowStyle-nativeDesc",
            descFallback: "Use your system's default window decorations. Recommended for most users.",
            screenshot: "legcord://assets/native.png",
            recommended: true,
        },
        {
            id: "default",
            titleKey: "setup-windowStyle-customTitle",
            titleFallback: "Custom Titlebar",
            descKey: "setup-windowStyle-customDesc",
            descFallback: "Use Cordium's custom titlebar design",
            screenshot: "legcord://assets/custom.png",
        },
    ];
    const lang = t();

    return (
        <div class="setup-step">
            <div class="setup-header">
                <h2 class="setup-title">{lang?.["setup-chooseWindowStyle"] ?? "Choose Window Style"}</h2>
                <p class="setup-subtitle">
                    {lang?.["setup-selectAppearance"] ?? "Select how Cordium appears on your machine"}
                </p>
            </div>

            <div class="setup-options">
                <For each={styles}>
                    {(item) => (
                        <OptionCard
                            selected={selectedStyle() === item.id}
                            onSelect={() => onSelect(item.id)}
                            title={lang?.[item.titleKey] ?? item.titleFallback}
                            description={lang?.[item.descKey] ?? item.descFallback}
                            badge={item.recommended ? (lang?.["setup-recommended"] ?? "Recommended") : undefined}
                            preview={item.screenshot}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};

const TraySettings = ({
    selectedOption,
    onSelect,
    t,
}: {
    selectedOption: Accessor<string | null>;
    onSelect: (optionId: string) => void;
    t: () => Lang;
}) => {
    const options = [
        {
            id: "dynamic",
            titleKey: "setup-trayEnableTitle",
            titleFallback: "Enable Tray Icon",
            descKey: "setup-trayEnableDesc",
            descFallback: "Show Cordium in your system tray",
        },
        {
            id: "disabled",
            titleKey: "setup-trayDisableTitle",
            titleFallback: "Disable Tray Icon",
            descKey: "setup-trayDisableDesc",
            descFallback: "Don't show Cordium in your system tray",
        },
    ];
    const lang = t();

    return (
        <div class="setup-step">
            <div class="setup-header">
                <h2 class="setup-title">{lang?.["setup-systemTray"] ?? "System Tray"}</h2>
                <p class="setup-subtitle">
                    {lang?.["setup-trayChoose"] ?? "Choose whether to enable the system tray icon"}
                </p>
            </div>

            <Show when={window.setup.os === "linux"}>
                <div class="setup-warning">
                    <WarningIcon />
                    <span>
                        {lang?.["setup-linuxTrayWarning"] ??
                            "System tray functionality may have issues or behave differently on Linux systems."}
                    </span>
                </div>
            </Show>

            <div class="setup-options">
                <For each={options}>
                    {(option) => (
                        <OptionCard
                            selected={selectedOption() === option.id}
                            onSelect={() => onSelect(option.id)}
                            title={lang?.[option.titleKey] ?? option.titleFallback}
                            description={lang?.[option.descKey] ?? option.descFallback}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};

const Finish = ({ restart, t }: { restart: () => void; t: () => Lang }) => (
    <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} class="setup-finish">
        <div class="setup-finish-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" role="presentation">
                <circle cx="12" cy="12" r="12" fill="var(--brand-500)" />
                <path
                    d="M7.5 12.5 10.5 15.5 16.5 8.5"
                    stroke="white"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </div>
        <h1 class="setup-title setup-title--hero">{t()?.["setup-finishTitle"] ?? "You're All Set!"}</h1>
        <p class="setup-subtitle setup-subtitle--hero">
            {t()?.["setup-finishSubtitle"] ??
                "Your Cordium configuration is complete and personalized to your preferences."}
        </p>
        <div class="setup-note">
            <p>
                {t()?.["setup-finishSettingsNote"] ??
                    "Need to make changes later? You'll find all these options in Discord's settings menu under Cordium."}
            </p>
        </div>
        <Button
            color={ButtonColors.PRIMARY}
            size={ButtonSizes.LARGE}
            onClick={restart}
            class="setup-cta"
            style={ctaStyle}
        >
            {t()?.["setup-launchLegcord"] ?? "Launch Cordium"}
        </Button>
    </Motion.div>
);

const ModSelector = ({
    selectedMod,
    onSelect,
    t,
}: {
    selectedMod: Accessor<string>;
    onSelect: (modId: string) => void;
    t: () => Lang;
}) => {
    const mods = [
        {
            id: "shelter",
            titleKey: "setup-shelterOnlyTitle",
            titleFallback: "Shelter Only",
            descKey: "setup-shelterOnlyDesc",
            descFallback: "Cordium was built around Shelter. Most typical users won't need another client mod.",
            recommended: true,
            icon: "legcord://assets/shelter.svg",
        },
        {
            id: "vencord",
            titleKey: "setup-vencordTitle",
            titleFallback: "Vencord",
            descKey: "setup-vencordDesc",
            descFallback: "Client mod with plugins and themes.",
            icon: "legcord://assets/vencord.png",
        },
        {
            id: "equicord",
            titleKey: "setup-equicordTitle",
            titleFallback: "Equicord",
            descKey: "setup-equicordDesc",
            descFallback: "A fork of Vencord with more plugins.",
            icon: "legcord://assets/equicord.png",
        },
    ];
    const lang = t();

    return (
        <div class="setup-step">
            <div class="setup-header">
                <h2 class="setup-title">{lang?.["setup-modSelectorTitle"] ?? "Choose Your Client Mod"}</h2>
                <p class="setup-subtitle">
                    {lang?.["setup-modSelectorSubtitle"] ??
                        "Cordium includes Shelter out of the box, but you can also choose another client mod if wanted."}
                </p>
            </div>

            <div class="setup-options">
                <For each={mods}>
                    {(mod) => (
                        <OptionCard
                            selected={selectedMod() === mod.id}
                            onSelect={() => onSelect(mod.id)}
                            title={lang?.[mod.titleKey] ?? mod.titleFallback}
                            description={lang?.[mod.descKey] ?? mod.descFallback}
                            badge={mod.recommended ? (lang?.["setup-recommended"] ?? "Recommended") : undefined}
                            icon={mod.icon}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};

function Stepper() {
    const [t] = createResource(() => window.setup.getRawLang());
    const [currentStep, setCurrentStep] = createSignal(0);
    const [selectedStyle, setSelectedStyle] = createSignal("native");
    const [selectedMod, setSelectedMod] = createSignal("shelter");
    const [selectedTray, setSelectedTray] = createSignal<string | null>(null);
    const maxSteps = 5;

    onMount(() => {
        window.setup.saveSettings({ windowStyle: "native", mods: [] });
    });

    const canProceed = createMemo(() => {
        switch (currentStep()) {
            case 0:
            case 1:
            case 2:
                return true;
            case 3:
                return selectedTray() !== null;
            default:
                return true;
        }
    });

    const handleStyleSelect = (styleId: string) => {
        setSelectedStyle(styleId);
        window.setup.saveSettings({ windowStyle: styleId });
    };

    const handleModSelect = (modId: string) => {
        setSelectedMod(modId);
        if (modId !== "shelter") {
            window.setup.saveSettings({ mods: [modId] });
        } else {
            window.setup.saveSettings({ mods: [] });
        }
    };

    const handleTraySelect = (trayId: string) => {
        setSelectedTray(trayId);
        window.setup.saveSettings({ tray: trayId });
    };

    const handleNext = () => {
        if (!canProceed()) return;
        setCurrentStep((prev) => Math.min(prev + 1, maxSteps - 1));
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const restart = () => {
        console.log("Restarting...");
        window.setup.saveSettings({ doneSetup: true });
        window.setup.restart();
    };

    const stepOfText = () => {
        const lang = t();
        const template = lang?.["setup-stepOf"] ?? "Step {current} of {total}";
        return template.replace("{current}", String(currentStep() + 1)).replace("{total}", String(maxSteps));
    };

    return (
        <Motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} class="setup-shell">
            <Show when={currentStep() !== 0 && currentStep() !== 4}>
                <Progress current={currentStep()} total={maxSteps} />
            </Show>

            <div class={`setup-body ${niceScrollbarsClass()}`}>
                <Show when={currentStep() === 0}>
                    <Welcome onNext={handleNext} t={t} />
                </Show>
                <Show when={currentStep() === 1}>
                    <WindowStyle selectedStyle={selectedStyle} onSelect={handleStyleSelect} t={t} />
                </Show>
                <Show when={currentStep() === 2}>
                    <ModSelector selectedMod={selectedMod} onSelect={handleModSelect} t={t} />
                </Show>
                <Show when={currentStep() === 3}>
                    <TraySettings selectedOption={selectedTray} onSelect={handleTraySelect} t={t} />
                </Show>
                <Show when={currentStep() === 4}>
                    <Finish restart={restart} t={t} />
                </Show>
            </div>

            <Show when={currentStep() !== 0 && currentStep() !== 4}>
                <div class="setup-footer">
                    <Button
                        color={ButtonColors.SECONDARY}
                        size={ButtonSizes.MEDIUM}
                        onClick={handleBack}
                        class="setup-footer-btn"
                        style={footerBtnStyle}
                    >
                        {t()?.["setup-back"] ?? "Back"}
                    </Button>
                    <span class="setup-step-indicator">{stepOfText()}</span>
                    <Button
                        color={ButtonColors.PRIMARY}
                        size={ButtonSizes.MEDIUM}
                        disabled={!canProceed()}
                        onClick={handleNext}
                        class="setup-footer-btn"
                        style={footerBtnStyle}
                    >
                        {t()?.["setup-next"] ?? "Next"}
                    </Button>
                </div>
            </Show>
        </Motion.div>
    );
}

const rootElement = document.getElementById("root");
if (rootElement) {
    render(Stepper, rootElement);
} else {
    console.error("Root element not found");
}
