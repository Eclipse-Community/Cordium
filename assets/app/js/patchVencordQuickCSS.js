// dirty hack to replace Vencord's quick css editor with Legcord's
// fixes the white window bug

if (window.VencordNative) {
    Vencord.Settings.useQuickCss = false;
    let settings = VencordNative.settings.get()
    settings.useQuickCss = false;
    VencordNative.settings.set(settings)
    VencordNative.quickCss.openEditor = function openEditor() {
        shelter.ui.openConfirmationModal({
            header: () => "Vencord QuickCSS is not compatible",
            body: () => `Vencord’s QuickCSS editor is not supported in Cordium. Cordium uses its own Quick CSS editor instead which can be found in it's respective themes section.
                Would you like to import your existing Vencord CSS into Cordium?`,
            type: "danger",
            confirmText: "Import CSS",
            cancelText: "Cancel"
            }).then(    
            async () => {
                const css = await VencordNative.quickCss.get();
                window.legcord.themes.importQuickCss(css);
                window.legcord.themes.openQuickCss()
            },
            () => console.log("Cancel.")
        );
        
    }
}