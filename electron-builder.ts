import type { Configuration } from "electron-builder";

export const config: Configuration = {
    appId: "app.ecx.Cordium",
    productName: "Cordium",
    // Biome treats electron-builder macro placeholders as template syntax.
    // biome-ignore lint/suspicious/noTemplateCurlyInString: electron-builder expands these placeholders.
    artifactName: "Cordium-${version}-${os}-${arch}.${ext}",
    protocols: [
        {
            name: "Discord",
            schemes: ["discord"],
        },
    ],

    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
    },

    files: [
        "!*",
        "assets",
        "node-modules",
        "ts-out",
        "dist/venmic-arm64.node",
        "dist/venmic-x64.node",
        "package.json",
        "license.txt",
    ],

    electronDownload: {
        cache: ".cache",
    },

    electronFuses: {
        runAsNode: false,
        enableCookieEncryption: false,
        enableNodeOptionsEnvironmentVariable: false,
        enableNodeCliInspectArguments: false,
        enableEmbeddedAsarIntegrityValidation: false,
        onlyLoadAppFromAsar: true,
        loadBrowserProcessSpecificV8Snapshot: false,
        grantFileProtocolExtraPrivileges: false,
    },
};

export default config;
