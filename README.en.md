<div align="center">

<img src="icons/icon-128.png" alt="yt-cap" width="128" height="128">

# yt-cap

**Preview and download YouTube thumbnails with a single keystroke**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[日本語](README.md) | **English**

---

Press **your shortcut key** on any YouTube video page to preview and download the highest-quality thumbnail.

</div>

<br>

## ✨ Features

| | Feature | Description |
|:---|:---|:---|
| 🖼️ | **Hi-res thumbnails** | Automatically resolves the best quality: `maxresdefault` → `sddefault` → `hqdefault` |
| ⌨️ | **Keyboard shortcut** | Assign any key you like to instantly show the preview ([how to set it](#set-the-keyboard-shortcut)) |
| 👁️ | **Preview before download** | Confirm the thumbnail, then `Enter` to download, `⌘/Ctrl+Enter` to choose where to save, or `Escape` to cancel |
| 📝 | **Auto file naming** | Names files like `Video title_VIDEOID.jpg`; invalid characters are replaced automatically |
| 🎯 | **Broad URL support** | Works on regular videos, Shorts, and live streams (`/live/`) |
| 🔧 | **Settings page** | Configure language, file name format, and the default download folder |

<br>

## 🔧 Tech Stack

```
Chrome Extension (Manifest V3)
├── TypeScript 5.4          … Type-safe development
├── Chrome Downloads API    … Thumbnail download
├── Chrome Scripting API    … Content script injection
├── Chrome Storage API      … Persistent settings
└── Chrome Notifications    … Download completion alerts
```

<br>

## 🚀 Setup

Works on Google Chrome and other Chromium-based browsers. There are two ways to install it.

### A. Download the zip (easy)

1. Download `yt-cap-vX.Y.Z.zip` from [Releases](https://github.com/P0KEBAN/yt-cap/releases/latest)
2. Unzip it (you get a `yt-cap` folder)
3. Continue to [Load into Chrome](#load-into-chrome) and select the unzipped `yt-cap` folder

> [!IMPORTANT]
> Chrome keeps loading the extension from the folder you selected. Put the unzipped `yt-cap` folder somewhere you will not delete or move it.

### B. Build from source

Requires [Node.js](https://nodejs.org/).

```bash
# 1. Clone the repository
git clone https://github.com/P0KEBAN/yt-cap.git
cd yt-cap

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build
```

### Load into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `yt-cap` folder (the unzipped folder or the cloned folder)
5. Then set the keyboard shortcut as described below

> [!TIP]
> After making code changes, run `npm run build` and click the **reload button** on `chrome://extensions`.

### Set the keyboard shortcut

You assign the shortcut key yourself in Chrome's settings.

1. Open `chrome://extensions/shortcuts` from the address bar (or click **"Set shortcut"** on the yt-cap settings page)
2. Find **yt-cap** in the list
3. Click the field next to "Preview and download the YouTube thumbnail" and press the key combination you want

> [!NOTE]
> The extension suggests `⌘⇧Y` (`Ctrl+Shift+Y` on Windows/Linux), but **Chrome may not assign it automatically** — for example when another extension or Chrome itself already uses that key. If nothing happens when you press the shortcut, check this page first.
>
> You can also use yt-cap without a shortcut by clicking its icon in the toolbar.

<br>

## 📖 Usage

```
                ┌──────────────────────────────┐
                │   Open a YouTube video page   │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │  Shortcut or toolbar button   │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   Thumbnail preview appears   │
                └──────────────┬───────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          ┌──────────────────┐   ┌─────────────────┐
          │ Enter: Download   │   │  Escape: Cancel │
          └─────────┬────────┘   └─────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │ Ctrl/⌘+Enter:    │
          │ Choose location  │
          └──────────────────┘
```

### Settings

1. **Right-click** the extension icon → select **"Options"**
2. The current shortcut key is shown at the top ("Not set" if none is assigned)
3. You can configure:
   - **Language**: Auto / English / 日本語
   - **File name format**: `Title + video ID` / `Title` / `Video ID only`
   - **Default download folder**: `Downloads` saves to the browser downloads folder; subfolders such as `YouTube/Thumbnails` are created under it

In the preview overlay, press **Enter** to save to the default download folder. Press **⌘+Enter** on macOS or **Ctrl+Enter** on Windows/Linux to choose the save location with the browser dialog. Press **Escape** or click outside the preview to close it.

<br>

## 📁 Project Structure

```
yt-cap/
├── 📄 manifest.json        … Chrome extension manifest (MV3)
├── 📦 package.json          … npm config & build scripts
├── ⚙️ tsconfig.json         … TypeScript configuration
├── 🎨 icons/                … Extension icons (16/48/128px)
├── 📂 scripts/
│   └── package.sh          … Builds the distributable zip
├── 📂 src/
│   ├── background.ts       … Service Worker (download logic)
│   ├── content.ts           … Content script (preview UI)
│   ├── i18n.ts              … Internationalization (en/ja)
│   ├── options.html         … Options page HTML
│   ├── options.ts           … Options page logic
│   ├── options.css          … Options page styles
│   ├── settings.ts          … Settings loading & normalization
│   ├── overlay.css          … Preview overlay styles
│   └── types.ts             … Type definitions
└── 📂 dist/                 … Build output (generated)
```

<br>

## 🛠️ Development

```bash
# Type-check only
npm run typecheck

# Build
npm run build

# Create the distributable zip in release/ (also builds)
npm run package
```

<br>

## ⚠️ Known Limitations

- Only works on YouTube pages
- Thumbnails may not be available for private or age-restricted videos

<br>

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<br>

---

<div align="center">

**[⬆ Back to top](#yt-cap)**

</div>
