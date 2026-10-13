<div align="center">

<img src="icons/icon-128.png" alt="yt-cap" width="128" height="128">

# yt-cap

**YouTubeサムネイルをワンキーでプレビュー＆ダウンロードするChrome拡張**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**日本語** | [English](README.en.md)

---

YouTube動画ページを閲覧中に **ショートカットキー** を押すだけで、最高画質のサムネイルをプレビュー＆ダウンロードできます。

</div>

<br>

## ✨ 特徴

| | 機能 | 説明 |
|:---|:---|:---|
| 🖼️ | **高画質サムネイル取得** | `maxresdefault` → `sddefault` → `hqdefault` の順で最適な画質を自動解決 |
| ⌨️ | **キーボードショートカット** | 好きなキーを割り当てて、プレビューを即表示（[設定方法](#ショートカットキーの設定)） |
| 👁️ | **プレビュー付きダウンロード** | 保存前にサムネイルを確認、`Enter` で保存・`⌘/Ctrl+Enter` で保存先選択・`Escape` でキャンセル |
| 📝 | **ファイル名の自動生成** | `動画タイトル_動画ID.jpg` など、設定した形式で命名（使えない文字は自動置換） |
| 🎯 | **幅広いURL対応** | 通常の動画ページ、Shorts、ライブ配信（`/live/`）に対応 |
| 🔧 | **設定画面** | 言語・ファイル名形式・デフォルトのダウンロード場所を設定可能 |

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

Google Chrome または Chromium系ブラウザで使えます。入れ方は2通りあります。

### A. zipをダウンロードして使う（かんたん）

1. [Releases](https://github.com/P0KEBAN/yt-cap/releases/latest) から `yt-cap-vX.Y.Z.zip` をダウンロードする
2. zipを展開する（`yt-cap` フォルダができます）
3. 下の「[Chromeへの登録](#chromeへの登録)」に進み、展開した `yt-cap` フォルダを選ぶ

> [!IMPORTANT]
> Chromeは選んだフォルダをその場所から読み込み続けます。展開した `yt-cap` フォルダは、消したり移動したりしない場所に置いてください。

### B. ソースコードからビルドする

[Node.js](https://nodejs.org/) が必要です。

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
4. `yt-cap` フォルダ（zipを展開したフォルダ、またはクローンしたフォルダ）を選択
5. 続けて、下の「ショートカットキーの設定」を行う

> [!TIP]
> コードを変更した場合は `npm run build` を実行し、`chrome://extensions` で拡張機能の **更新ボタン** を押してください。

### ショートカットキーの設定

ショートカットキーは、Chromeの設定画面で自分の好きなキーを割り当てて使います。

1. アドレスバーに `chrome://extensions/shortcuts` と入力して開く（yt-cap の設定画面にある **「ショートカットを設定」** ボタンからも開けます）
2. 一覧から **yt-cap** を探す
3. 「Preview and download the YouTube thumbnail」の入力欄をクリックし、使いたいキーの組み合わせを押す

> [!NOTE]
> 拡張機能は `⌘⇧Y`（Windows/Linuxは `Ctrl+Shift+Y`）を候補として申請していますが、**自動では割り当てられないことがあります**（ほかの拡張機能やChrome自体が同じキーを使っている場合など）。ショートカットを押しても何も起きないときは、まずこの画面で割り当てを確認してください。
>
> ショートカットを設定しなくても、ツールバーの yt-cap アイコンをクリックすれば同じように使えます。

<br>

## 📖 使い方

```
                ┌──────────────────────────────┐
                │    YouTube動画ページを開く      │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │ ショートカット or ツールバーボタン │
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
          └─────────┬────────┘   └─────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │ ⌘/Ctrl+Enter:   │
          │   保存先を選択    │
          └──────────────────┘
```

### 設定

1. 拡張機能アイコンを **右クリック** →「**オプション**」を選択
2. いちばん上に、現在のショートカットキーが表示されます（割り当てがなければ「未設定」）
3. 以下を設定できます
   - **言語**: 自動 / English / 日本語
   - **ファイル名の形式**: `タイトル＋動画ID` / `タイトル` / `動画IDのみ`
   - **デフォルトのダウンロード場所**: `Downloads` はブラウザのダウンロードフォルダ直下、`YouTube/Thumbnails` のようなサブフォルダはその配下に作成されます

プレビュー表示中は **Enter** でデフォルトのダウンロード場所に保存します。macOS は **⌘+Enter**、Windows/Linux は **Ctrl+Enter** で保存ダイアログを開き、保存先を選べます。**Escape** またはプレビューの外側をクリックすると閉じます。

<br>

## 📁 プロジェクト構成

```
yt-cap/
├── 📄 manifest.json        … Chrome拡張のマニフェスト (MV3)
├── 📦 package.json          … npm設定・ビルドスクリプト
├── ⚙️ tsconfig.json         … TypeScript設定
├── 🎨 icons/                … 拡張機能アイコン (16/48/128px)
├── 📂 scripts/
│   └── package.sh          … 配布用zipの作成
├── 📂 src/
│   ├── background.ts       … Service Worker (ダウンロード処理)
│   ├── content.ts           … コンテンツスクリプト (プレビューUI)
│   ├── i18n.ts              … 国際化 (en/ja)
│   ├── options.html         … 設定画面HTML
│   ├── options.ts           … 設定画面ロジック
│   ├── options.css          … 設定画面スタイル
│   ├── settings.ts          … 設定の読み込み・正規化
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

# 配布用zipを release/ に作成（ビルドも行う）
npm run package
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

**[⬆ トップへ戻る](#yt-cap)**

</div>
