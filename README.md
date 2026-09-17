# Mynavi Filter

Mynavi Filter 是一个小型 Chrome Extension，用于整理マイナビ新卒求职网站上的企业浏览状态。

当前仓库包含 v0.1 的核心闭环：真实网页 URL/DOM 解析、企业身份识别、年度隔离的本地 storage、详情页自动标记 `viewed`、搜索卡片状态按钮、当前页统计和即时筛选。视觉仍保持克制，后续再做 UI 精修。

## 支持范围

- `https://job.mynavi.jp/27/pc/*`
- `https://job.mynavi.jp/28/pc/*`

代码从 URL 动态解析年度，但正式启用的年度集中定义在 `src/config.js`。未来出现 2029 页面时，需要完成真实页面验证后再加入支持列表。

## 隐私与数据

- 只使用 `chrome.storage.local`。
- 不上传企业浏览记录或搜索数据。
- 不使用后端、账号、云同步或第三方分析 SDK。
- 2027 与 2028 的企业状态分别保存。
- 即使两个年度使用相同数字 ID，`27:66450` 和 `28:66450` 也属于独立记录。

## 加载扩展

1. 打开 `chrome://extensions`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本仓库根目录 `mynavi-filter`。

本项目没有 npm 依赖，也没有构建步骤。

## 运行测试

需要已安装 Node.js：

```bash
node --test tests/*.test.js
```

## 目录结构

```text
mynavi-filter/
├── manifest.json
├── src/
│   ├── config.js
│   ├── content/
│   │   ├── company.js
│   │   ├── main.js
│   │   ├── search.js
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

## 模块职责

- `src/config.js`：唯一的年度支持列表、schema 版本和默认设置。
- `src/utils/mynavi-url.js`：识别 Mynavi、年度、页面类型和详情 URL 企业 ID。
- `src/utils/company-id.js`：生成年度隔离 key，并解析卡片和详情页身份。
- `src/storage/storage.js`：唯一允许调用 `chrome.storage.local` 的模块。
- `src/content/search.js`：读取搜索结果企业卡片。
- `src/content/company.js`：读取企业详情上下文。
- `src/content/status.js`：统一状态、统计和隐藏规则。
- `src/content/search-ui.js`：幂等注入工具栏、卡片按钮和筛选行为。
- `src/content/main.js`：根据当前 URL 调用页面 adapter，并启动自动记忆/搜索增强。

## 当前明确不包含

- popup、dashboard、登录或订阅
- 跨年度企业状态同步

真实网页调查见 [`docs/research/mynavi-2027-2028-dom.md`](docs/research/mynavi-2027-2028-dom.md)。
