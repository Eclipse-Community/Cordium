
![Cordium](https://github.com/user-attachments/assets/f7b007d4-44fa-4c88-96e4-0a448b568b5d)

# Features

- **Windows XP support!**

   Cordium was created as a rebase of Legcord Legacy with the balloon notifications feature ported to the latest stable Legcord sources. It is also created to run on legacy Windows, since Chromium, and therefore Electron, and therefore Discord doesn't support them. In my case this was Windows 7 and 8 as that is what I use on my main systems. However I only wanted to make an official release once a modern Electron version that supports Windows XP came to exist. Thanks to Alex313031 of Thorium fame, this now exists as [Electron for Legacy Windows](https://github.com/Alex313031/electron-legacy)!

- **Balloon notifications**

   Native balloon notifications that fit into your operating system far better than the default notifications.

- **Standalone client**

   Cordium is built as a standalone client and doesn't rely on the original Discord client in any way.

- **Various mods built-in**

   Enjoy [Vencord](https://github.com/Vendicated/Vencord), [Equicord](https://github.com/Equicord/Equicord), [Shelter](https://github.com/uwu/shelter) and their many features, or have a more vanilla experience, it's your choice!

- **Themes**

   Cordium natively supports theming of the entire app, you can easily import BetterDiscord themes and manage them

- **Made for Privacy**

   Cordium automatically blocks all of Discord's trackers; even without any client mods, you can feel safe and secure!

- **Supports Rich Presence**

   Unlike other clients, Cordium supports rich presence (game activity) out of the box thanks to [arRPC](https://arrpc.openasar.dev). (Note: This is untested since I schizo)

- **Much more stable**

   Cordium is using a newer build of Electron than the stock Discord app. This means you can have a much more stable and secure experience, along with slightly better performance.

# How to run/install it?

### Pre-built binaries

 Check the **[releases tab](https://github.com/Eclipse-Community/Cordium/releases)** for precompiled packages for Windows XP and later.

### Compiling

 Alternatively, you can run Cordium from source ([NodeJS v26 and newer](https://nodejs.dev) and [pnpm](https://pnpm.io/installation#using-npm)) are required:

 1. Clone Cordium repo: `git clone https://github.com/Eclipse-Community/Cordium.git`
 2. Run `pnpm install` to install dependencies
 3. Build with `pnpm run build`
 4. Compile/Package with `pnpm run package`

# FAQ

## Do you have a support Discord?

[![Discord Server](https://dcbadge.limes.pink/api/server/ecx)](https://discord.gg/ecx)

## Will I get banned for using this?

- You are breaking [Discord ToS](https://discord.com/terms#software-in-discord%E2%80%99s-services) by using Cordium, but no one has been banned from using it or any of the client mods included.

## How can I access the settings?

- Open Discord settings and there should be a button `Cordium Settings` button with a white Discord icon, you can also right click on the tray icon and click `Open Settings`

## How does this work?

- We utilize the official web app and package it within Electron. While this approach may seem familiar, our focus is on delivering a truly customized and enhanced experience. Unlike many others, we provide seamless integration for loading themes and mods without the need for installers or injectors. You can easily enable transparency effects and adopt Windows' Fluent Design, offering a modern and sleek interface. Though it's fundamentally a web wrapper, we have implemented numerous optimizations and patches to ensure a smooth and tailored experience for you.

## Does Cordium have a portable mode for windows?

- Yes it does! Simply add a folder called "cordium-data" in the folder where your Cordium executable is located and start Cordium. Make sure to download the archive/zip file, or the premade portable version with the folder already made..

# Credits

- [The Legcord team for the original clients I forked from, Legcord and Legcord Legacy](https://github.com/Legcord)
- [Legcord UI design, branding, and a few features](https://github.com/kckarnige)
- [OpenAsar](https://github.com/GooseMod/OpenAsar)
- [arRPC (for Rich Presence)](https://github.com/OpenAsar/arrpc)
- [electron-builder](https://electron.build)
  
Discord is trademark of Discord Inc. Cordium is not affiliated with or endorsed by Discord Inc.
