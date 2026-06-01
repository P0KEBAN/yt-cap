<div align="center">

# 🎬 yt-cap

**YouTubeサムネイルをワンキーでプレビュー＆ダウンロードするChrome拡張**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

YouTube動画ページを閲覧中に **`⌘⇧Y`** を押すだけで、最高画質のサムネイルをプレビュー＆ダウンロードできます。

**[🇺🇸 English README](README.md)**

</div>

<br>

## ✨ 特徴

| | 機能 | 説明 |
|:---|:---|:---|
| 🖼️ | **高画質サムネイル取得** | `maxresdefault` → `sddefault` → `hqdefault` の順で最適な画質を自動解決 |
| ⌨️ | **キーボードショートカット** | `⌘⇧Y` / `Ctrl+Shift+Y` でプレビューを即表示 |
| 👁️ | **プレビュー付きダウンロード** | 保存前にサムネイルを確認、`Enter` でダウンロード・`Escape` でキャンセル |
| 📝 | **ファイル名の自動生成** | `動画タイトル_動画ID.jpg` など、設定した形式で命名（使えない文字は自動置換） |
| 🎯 | **幅広いURL対応** | 通常の動画ページ、Shorts、`youtu.be` 短縮URLすべてに対応 |
| 🔧 | **設定画面** | 言語・ファイル名形式・保存ダイアログの有無を設定可能 |

<br>

## 🔧 技術スタック

```
Chrome Extension (Manifest V3)
├── TypeScript 5.4          … 型安全な開発
├── Chrome Downloads API    … サムネイルのダウンロード
├── Chrome Scripting API    … コンテンツスクリプト注入
├── Chrome Storage API      … 設定の永続化
└── Chrome Notifications    … ダウンロード完了通知
```

<br>

## 🚀 セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) がインストール済みであること
- Google Chrome / Chromium系ブラウザ

### インストール手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/P0KEBAN/yt-cap.git
cd yt-cap

# 2. 依存関係をインストール
npm install

# 3. TypeScriptをビルド
npm run build
```

### Chromeへの登録

1. `chrome://extensions` を開く
2. **デベロッパーモード** を有効化（右上のトグル）
3. **「パッケージ化されていない拡張機能を読み込む」** をクリック
4. クローンしたフォルダを選択

> [!TIP]
> コードを変更した場合は `npm run build` を実行し、`chrome://extensions` で拡張機能の **更新ボタン** を押してください。

<br>

## 📖 使い方

```
                ┌──────────────────────────────┐
                │    YouTube動画ページを開く      │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   ⌘⇧Y  or ツールバーボタン     │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   サムネイルプレビューが表示     │
                └──────────────┬───────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          ┌──────────────────┐   ┌─────────────────┐
          │ Enter:           │   │  Escape: 取消   │
          │   ダウンロード    │   │                 │
          └──────────────────┘   └─────────────────┘
```

### 設定

1. 拡張機能アイコンを **右クリック** →「**オプション**」を選択
2. 以下を設定できます
   - **言語**: 自動 / English / 日本語
   - **ファイル名の形式**: `タイトル＋動画ID` / `タイトル` / `動画IDのみ`
   - **保存ダイアログの表示**: オンにすると毎回保存先を選べます。オフのときはダウンロードフォルダへ直接保存します

> [!NOTE]
> ショートカットが動作しない場合は `chrome://extensions/shortcuts` で `yt-cap` のショートカットキーを手動設定してください。Manifestの `suggested_key` はあくまで候補で、Chrome側の状態により自動設定されない場合があります。

<br>

## 📁 プロジェクト構成

```
yt-cap/
├── 📄 manifest.json        … Chrome拡張のマニフェスト (MV3)
├── 📦 package.json          … npm設定・ビルドスクリプト
├── ⚙️ tsconfig.json         … TypeScript設定
├── 🎨 icons/                … 拡張機能アイコン (16/48/128px)
├── 📂 src/
│   ├── background.ts       … Service Worker (ダウンロード処理)
│   ├── content.ts           … コンテンツスクリプト (プレビューUI)
│   ├── i18n.ts              … 国際化 (en/ja)
│   ├── options.html         … 設定画面HTML
│   ├── options.ts           … 設定画面ロジック
│   ├── options.css          … 設定画面スタイル
│   ├── overlay.css          … プレビューオーバーレイスタイル
│   └── types.ts             … 型定義
└── 📂 dist/                 … ビルド出力 (生成ファイル)
```

<br>

## 🛠️ 開発

```bash
# 型チェックのみ実行
npm run typecheck

# ビルド
npm run build
```

<br>

## ⚠️ 既知の制限事項

- YouTube以外のサイトでは動作しません
- プライベート動画・年齢制限付き動画はサムネイルが取得できない場合があります

<br>

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

<br>

---

<div align="center">

**[⬆ トップへ戻る](#-yt-cap)**

</div>
