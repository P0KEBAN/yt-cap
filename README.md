<div align="center">

# 🎬 yt-cap

**Preview and download YouTube thumbnails with a single keystroke**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

Press **`⌘⇧Y`** on any YouTube video page to preview and download the highest-quality thumbnail.

**[🇯🇵 日本語版 README はこちら](README.ja.md)**

</div>

<br>

## ✨ Features

| | Feature | Description |
|:---|:---|:---|
| 🖼️ | **Hi-res thumbnails** | Automatically resolves the best quality: `maxresdefault` → `sddefault` → `hqdefault` |
| ⌨️ | **Keyboard shortcut** | `⌘⇧Y` / `Ctrl+Shift+Y` to instantly show the preview |
| 👁️ | **Preview before download** | Confirm the thumbnail, then `Enter` to download, `⌘/Ctrl+Enter` to choose where to save, or `Escape` to cancel |
| 📝 | **Auto file naming** | Names files like `Video title_VIDEOID.jpg`; invalid characters are replaced automatically |
| 🎯 | **Broad URL support** | Works on regular videos, Shorts, and `youtu.be` short links |
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

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- Google Chrome or any Chromium-based browser

### Installation

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
4. Select the cloned folder

> [!TIP]
> After making code changes, run `npm run build` and click the **reload button** on `chrome://extensions`.

<br>

## 📖 Usage

```
                ┌──────────────────────────────┐
                │   Open a YouTube video page   │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   ⌘⇧Y  or  toolbar button    │
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
2. You can configure:
   - **Language**: Auto / English / 日本語
   - **File name format**: `Title + video ID` / `Title` / `Video ID only`
   - **Default download folder**: `Downloads` saves to the browser downloads folder; subfolders such as `YouTube/Thumbnails` are created under it

In the preview overlay, press **Enter** to save to the default download folder. Press **⌘+Enter** on macOS or **Ctrl+Enter** on Windows/Linux to choose the save location with the browser dialog.

> [!NOTE]
> If the shortcut doesn't work, go to `chrome://extensions/shortcuts` and manually set the shortcut for `yt-cap`. The `suggested_key` in the manifest is only a suggestion and may not be automatically assigned by Chrome.

<br>

## 📁 Project Structure

```
yt-cap/
├── 📄 manifest.json        … Chrome extension manifest (MV3)
├── 📦 package.json          … npm config & build scripts
├── ⚙️ tsconfig.json         … TypeScript configuration
├── 🎨 icons/                … Extension icons (16/48/128px)
├── 📂 src/
│   ├── background.ts       … Service Worker (download logic)
│   ├── content.ts           … Content script (preview UI)
│   ├── i18n.ts              … Internationalization (en/ja)
│   ├── options.html         … Options page HTML
│   ├── options.ts           … Options page logic
│   ├── options.css          … Options page styles
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

**[⬆ Back to top](#-yt-cap)**

</div>
