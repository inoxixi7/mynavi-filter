# Mynavi Filter

**マイナビの企業検索を、もっと整理しやすく。**

Mynavi Filter は、マイナビ新卒（2027・2028）の企業検索結果に「閲覧済み」「興味あり」「興味なし」の状態を追加し、見た企業や候補から外した企業を整理できる Chrome 拡張機能です。

大量の企業を比較していると、

- 「この会社、前にも見た気がする」
- 「興味がない会社が何度も検索結果に出てくる」
- 「あとで見たい会社だけをまとめて確認したい」
- 「検索条件を変えるたびに、同じ会社をもう一度確認してしまう」

といったことが起こりやすくなります。

Mynavi Filter は、マイナビ本来の検索機能を置き換えるのではなく、**検索結果を自分で整理するための小さなレイヤー**を追加します。

> 現在は開発版（v0.1）です。Chrome Web Store ではまだ配布していません。

---

## Language

- 日本語（このページのメイン言語）
- [中文](#中文)
- [English](#english)

---

## 対応サイト

現在、以下の PC 版マイナビ新卒に対応しています。

- マイナビ2027  
  `https://job.mynavi.jp/27/pc/`
- マイナビ2028  
  `https://job.mynavi.jp/28/pc/`

年度は URL から自動で判定します。

2027 と 2028 の企業状態は別々に保存されます。同じ企業 ID が両年度で使われていても、自動的に状態を引き継ぐことはありません。

---

## できること

### 1. 企業を3つの状態で整理

検索結果の企業ごとに、次の状態を設定できます。

| 状態 | 意味 |
| --- | --- |
| ✓ 閲覧済み | 企業詳細ページを開いて確認した企業 |
| ☆ 興味あり | あとで再確認したい企業、応募候補 |
| × 興味なし | 今回は候補から外した企業 |

企業詳細ページを実際に開くと、未確認の企業は自動で「閲覧済み」になります。

すでに「興味あり」または「興味なし」に設定した企業を再度開いても、その状態は勝手に変更されません。

---

### 2. 閲覧済み・興味なし企業を非表示

検索結果から、次の企業を隠すことができます。

- 閲覧済みの企業
- 興味なしにした企業

企業データそのものは削除されません。

必要になったら非表示設定を解除したり、「興味なし」フィルターを使ったりして、あとから再確認できます。

---

### 3. 状態で絞り込み

検索結果ページのフローティングメニューから、現在のページを次の状態で絞り込めます。

- すべて
- 未確認
- 興味あり
- 閲覧済み
- 興味なし

たとえば「興味あり」だけを表示すれば、あとで比較したい企業だけをまとめて確認できます。

---

### 4. ページ内の件数を確認

現在の検索結果ページについて、

- 未確認
- 興味あり
- 閲覧済み
- 興味なし
- 非表示

の件数を確認できます。

これはマイナビ全体の企業数ではなく、**現在表示している検索結果ページ内の企業数**です。

---

### 5. 別タブで企業を開いても状態を同期

企業詳細を新しいタブで開いた場合でも、検索結果ページは `chrome.storage.onChanged` を使って状態を同期します。

そのため、検索結果ページを手動で再読み込みしなくても、対象企業の「閲覧済み」状態や件数が反映されます。

また、企業詳細からブラウザの「戻る」で検索結果に戻った場合も、`pageshow` を使って保存状態を再確認します。

---

## 使い方

### 基本的な流れ

1. マイナビ2027 または 2028 で企業を検索します。
2. 気になる企業の詳細ページを開きます。
3. 詳細ページを開いた企業は、自動で「閲覧済み」になります。
4. 検索結果で ☆ を押すと「興味あり」、× を押すと「興味なし」にできます。
5. 画面右下の Mynavi Filter ボタンから、表示する状態や非表示設定を変更できます。

たとえば、

```text
100社の検索結果
↓
30社を見る
↓
8社を「興味あり」
↓
22社を「興味なし」
↓
「興味なし企業を隠す」をON
```

とすると、次の企業探しを続けるときに、すでに候補から外した企業を何度も確認する必要がなくなります。

---

## インストール方法（開発版）

現在は Chrome Web Store では配布していないため、手動で読み込みます。

1. このリポジトリをダウンロードまたは clone します。
2. Chrome で `chrome://extensions` を開きます。
3. 右上の「デベロッパー モード」を ON にします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックします。
5. このリポジトリのルートフォルダ `mynavi-filter` を選択します。
6. マイナビ2027 または 2028 の検索結果ページを再読み込みします。

このプロジェクトには npm の依存関係やビルド作業はありません。

---

## データとプライバシー

Mynavi Filter は、企業の閲覧状態をブラウザ内の `chrome.storage.local` に保存します。

現在のバージョンでは、

- 外部サーバーへの送信なし
- ログイン機能なし
- ユーザーアカウントなし
- クラウド同期なし
- 広告 SDK なし
- アクセス解析 SDK なし

です。

保存される主な情報は次のとおりです。

- 対象年度
- マイナビ上の企業 ID
- 企業名
- 状態（閲覧済み / 興味あり / 興味なし）
- レコード作成日時
- 更新日時
- 最終閲覧日時

企業ごとのデータは独立した storage key に保存されます。

例：

```text
mynaviFilter:company:27:66450
mynaviFilter:company:28:66450
```

これにより、複数の企業ページを同時に開いたときに、別企業の更新がお互いを上書きしにくい構造にしています。

---

## 2027 と 2028 の扱い

Mynavi Filter は 2027 と 2028 の状態を分離して保存します。

例：

```text
27:66450
28:66450
```

は別のレコードです。

実際の調査では、同じ企業 ID が複数年度で同じ企業を指すケースが多く確認できましたが、すべての企業や将来年度で同じ仕様が保証されているわけではありません。

そのため、現時点では年度をまたいで「興味あり」「興味なし」などを自動同期しません。

---

## この拡張機能がやらないこと

v0.1 では、機能を意図的に絞っています。

現在は以下を実装していません。

- マイナビへの自動応募
- エントリー操作の自動化
- ES の自動入力
- AI による企業評価
- 年収・休日・勤務地などによる独自検索
- 企業詳細ページの大量自動取得
- リクナビ、キャリタス、ONE CAREER など他サイトへの対応
- アカウント・クラウド同期
- 有料プラン・課金

まずは「大量の企業検索結果を整理しやすくする」という1つの課題に集中しています。

---

## 開発について

### 技術構成

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS
- `chrome.storage.local`
- Node.js `node:test`

React / Vue などのフレームワークは使用していません。

---

### テスト

Node.js がインストールされている環境で、次のコマンドを実行できます。

```bash
node --test tests/*.test.js
```

JavaScript の構文確認：

```bash
find src tests -name "*.js" -print0 | xargs -0 -n1 node --check
```

---

### ディレクトリ構成

```text
mynavi-filter/
├── manifest.json
├── src/
│   ├── config.js
│   ├── content/
│   │   ├── company.js
│   │   ├── main.js
│   │   ├── search.js
│   │   ├── search-ui.js
│   │   ├── status.js
│   │   └── styles.css
│   ├── storage/
│   │   └── storage.js
│   └── utils/
│       ├── company-id.js
│       └── mynavi-url.js
├── tests/
└── docs/
    ├── research/
    └── superpowers/
```

### 主なモジュール

- `src/config.js`  
  対応年度、storage key、デフォルト設定など。

- `src/utils/mynavi-url.js`  
  マイナビ URL、年度、ページ種別、企業 ID の判定。

- `src/utils/company-id.js`  
  検索結果や企業詳細ページから企業情報を取得。

- `src/storage/storage.js`  
  `chrome.storage.local` の読み書きを担当。

- `src/content/search.js`  
  検索結果ページの企業カードを解析。

- `src/content/company.js`  
  企業詳細ページを解析。

- `src/content/status.js`  
  閲覧状態、フィルター、表示・非表示ルール。

- `src/content/search-ui.js`  
  フローティングメニュー、企業カード上の状態ボタン、リアルタイム同期。

- `src/content/main.js`  
  現在のページを判定し、必要な処理を開始。

---

## 既知の注意点

マイナビは Mynavi Filter 向けの公式 DOM API を提供しているわけではありません。

そのため、マイナビ側の HTML 構造、class 名、URL 構造などが変更された場合、一部機能が動かなくなる可能性があります。

現在の実装は、マイナビ2027・2028 の実ページを確認したうえで作成しています。

調査内容：

[`docs/research/mynavi-2027-2028-dom.md`](docs/research/mynavi-2027-2028-dom.md)

---

## フィードバック

この拡張機能は、実際の就職活動で感じた「検索結果を整理しにくい」という問題から作り始めました。

特に、

- 日本で新卒就活をしている学生
- 留学生として日本で就職活動をしている人
- 多くの企業を比較している人

からのフィードバックを歓迎します。

不具合や改善案がある場合は GitHub Issues から共有してください。

---

## 免責事項

Mynavi Filter は個人開発の非公式ツールであり、株式会社マイナビおよびマイナビ新卒の公式サービスではありません。

「マイナビ」「Mynavi」などの名称・商標は、それぞれの権利者に帰属します。

---

# 中文

## 简介

Mynavi Filter 是一个用于 **マイナビ2027 / 2028 PC 版** 的 Chrome 扩展，主要解决日本新卒求职时“看过的企业和不感兴趣的企业仍反复出现在搜索结果里”的问题。

它不会取代 Mynavi 原本的搜索功能，而是在搜索结果上增加一层简单的整理功能。

目前支持：

- ✓ 已浏览
- ☆ 感兴趣
- × 不感兴趣
- 隐藏已浏览企业
- 隐藏不感兴趣企业
- 按状态筛选当前搜索结果
- 当前页面状态数量统计
- 在其他标签页打开企业详情后实时同步状态

---

## 为什么做这个插件

在 Mynavi 上连续寻找企业时，很容易遇到：

- 忘记某家公司之前是否已经看过
- 已经决定不考虑的公司再次出现在新的搜索结果中
- 想重新查看候选企业时很难快速筛出来
- 更换搜索条件后又重复打开同一家公司

Mynavi Filter 的目的就是让“搜索企业 → 查看 → 筛掉 → 保留候选”这个过程更清晰。

---

## 支持范围

- `https://job.mynavi.jp/27/pc/*`
- `https://job.mynavi.jp/28/pc/*`

2027 和 2028 的数据分别保存，不会自动跨年度同步状态。

---

## 使用方法

在企业搜索结果中：

- 点击 ✓：设为“已浏览”
- 点击 ☆：设为“感兴趣”
- 点击 ×：设为“不感兴趣”

真正打开企业详情页后，如果之前没有人工设置状态，会自动变为“已浏览”。

右下角的 Mynavi Filter 菜单可以：

- 查看未确认 / 感兴趣 / 已浏览 / 不感兴趣数量
- 只显示某一种状态
- 隐藏已浏览企业
- 隐藏不感兴趣企业

如果在新标签页打开企业详情，原搜索页也会通过 Chrome Storage 的变化通知自动更新状态和计数。

---

## 隐私

所有数据只保存在浏览器本地的 `chrome.storage.local`。

目前没有：

- 服务器上传
- 用户账号
- 云同步
- 广告 SDK
- 第三方统计 SDK

插件主要保存企业年度、企业 ID、企业名、状态以及相关时间信息。

---

## 安装开发版

1. 下载或 clone 本仓库。
2. 打开 `chrome://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择 `mynavi-filter` 根目录。
6. 重新打开或刷新 Mynavi 2027 / 2028。

项目没有 npm 依赖，也不需要 build。

---

## 开发与测试

运行测试：

```bash
node --test tests/*.test.js
```

当前使用 Manifest V3、原生 JavaScript、CSS 和 `chrome.storage.local`。

详细的 Mynavi 页面结构调查见：

[`docs/research/mynavi-2027-2028-dom.md`](docs/research/mynavi-2027-2028-dom.md)

---

## 注意

Mynavi Filter 是个人开发的非官方工具，与株式会社マイナビ没有官方关系。

如果 Mynavi 修改网页结构，插件的部分功能可能需要同步更新。

---

# English

## Overview

Mynavi Filter is a Chrome extension for the PC versions of **Mynavi 2027 and Mynavi 2028**.

It helps students organize large company search results by adding lightweight local statuses:

- ✓ Viewed
- ☆ Interested
- × Not interested

The extension is designed mainly for students doing new-graduate job hunting in Japan, including international students.

---

## Why it exists

When browsing many companies on Mynavi, it is easy to:

- open the same company more than once,
- forget which companies you already checked,
- keep seeing companies you already decided to skip,
- lose track of companies you want to revisit.

Mynavi Filter adds a simple organization layer on top of Mynavi's existing search results.

---

## Features

- Automatically marks a company as Viewed after its detail page is opened.
- Manually mark companies as Interested or Not interested.
- Hide Viewed companies.
- Hide Not interested companies.
- Filter the current result page by status.
- Show status counts for the current result page.
- Synchronize company status across Mynavi tabs using `chrome.storage.onChanged`.
- Refresh stored state when returning through browser back/forward cache.

---

## Supported pages

- `https://job.mynavi.jp/27/pc/*`
- `https://job.mynavi.jp/28/pc/*`

2027 and 2028 records are stored separately.

---

## Privacy

All company status data is stored locally with `chrome.storage.local`.

The current version has:

- no backend,
- no account system,
- no cloud sync,
- no analytics SDK,
- no advertising SDK.

---

## Install the development version

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `mynavi-filter` repository directory.
6. Reload a supported Mynavi page.

No npm install or build step is required.

---

## Development

Run tests:

```bash
node --test tests/*.test.js
```

The extension uses:

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS
- `chrome.storage.local`
- Node.js `node:test`

For details about the verified Mynavi DOM and URL structure, see:

[`docs/research/mynavi-2027-2028-dom.md`](docs/research/mynavi-2027-2028-dom.md)

---

## Disclaimer

Mynavi Filter is an independent, unofficial project and is not affiliated with or endorsed by Mynavi Corporation.

“Mynavi” and related names and trademarks belong to their respective owners.
