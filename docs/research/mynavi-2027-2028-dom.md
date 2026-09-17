# Mynavi 2027 / 2028 live DOM research

调查日期：2026-09-17

本报告记录 Mynavi Filter v0.1 框架开发前对公开页面进行的浏览器级调查。所有 selector 和 URL 结论均来自当日实际页面，而非根据需求文档推测。

## 调查页面

### 2027

- `https://job.mynavi.jp/27/pc/`
- `https://job.mynavi.jp/27/pc/search/query.html?/LICM:1/OP:1/CA:1,2,3,4,5/`
- `https://job.mynavi.jp/27/pc/search/inc63.html`
- `https://job.mynavi.jp/27/pc/search/corp66450/outline.html`

### 2028

- `https://job.mynavi.jp/28/pc/`
- `https://job.mynavi.jp/28/pc/corpinfo/displayCorpSearch/index?tab=corp`
- `https://job.mynavi.jp/28/pc/search/inc63.html`
- `https://job.mynavi.jp/28/pc/search/corp66450/outline.html`

## 搜索结果 URL

确认存在以下搜索结果 route family：

| 类型 | 2027 | 2028 |
| --- | --- | --- |
| 可分享搜索结果 | `/27/pc/search/query.html?...`、`/27/pc/search/inc63.html` | `/28/pc/search/inc63.html` |
| 条件搜索提交 | 搜索结果 form 使用年度相同的 route | `/28/pc/corpinfo/displayCorpSearch/doSearch` |
| 条件型结果 | `/27/pc/corpinfo/searchCorpListByGenCond/index/...` | `/28/pc/corpinfo/searchCorpListByGenCond/index/...` |
| 分页提交 | `/27/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage` | `/28/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage` |

URL parser 从 pathname 动态提取两位年度。正式支持范围仅由 `SUPPORTED_YEARS` 决定。

## 企业卡片 DOM

2027 和 2028 的关键结构一致：

```text
#contentsleft
└── .boxSearchresultEach.corp
    └── .boxSearchresultEach_head
        └── h3.withCheck
            └── a.js-add-examination-list-text
```

可使用的 selector：

- 结果区域：`#contentsleft`
- 企业卡片：`.boxSearchresultEach.corp`
- 企业名称和详情链接：`.boxSearchresultEach_head h3 a`
- 搜索结果 form：`#displaySearchCorpListByGenCondDispForm`

卡片实例：

```html
<div id="div66450" class="boxSearchresultEach corp label js-add-examination-list">
  <div class="boxSearchresultEach_head">
    <h3 class="withCheck">
      <a href="/28/pc/search/corp66450/outline.html"
         class="js-add-examination-list-text">
        (株)サンベルクスホールディングス【スーパーベルクス】
      </a>
    </h3>
  </div>
</div>
```

实际链接还包含 Mynavi 自己的 `target`、`id` 和 `onclick` 属性。插件不得改写这些属性或原有点击行为。

## PICK UP 与普通企业

两个年度中，PICK UP 企业和普通企业使用相同的 `.boxSearchresultEach.corp` 容器和标题 link。PICK UP 是标题 link 内的附加显示节点，不是另一种卡片类型。

同一食品行业结果页的观测：

| 年度 | 当前页企业数 | PICK UP | 普通企业 |
| --- | ---: | ---: | ---: |
| 2027 | 100 | 7 | 93 |
| 2028 | 100 | 16 | 84 |

企业名优先读取 link 的第一个 text node，可避免把 `PICK UP` 写入企业名称。

## 分页和搜索条件更新

分页 link 的 `href` 是 `javascript:void(0)`，点击后调用 `setSpecifiedPage(...)`，并把结果 form POST 到 `doSpecifiedPage`。实际操作产生完整文档导航，URL 变为对应的 POST endpoint。

2028 条件搜索也通过 form POST 到 `displayCorpSearch/doSearch`，并返回完整搜索结果文档。

本次测试未观察到企业卡片列表的 SPA 式局部替换。因此框架不启用 `MutationObserver`。后续只有在 UI 阶段发现可复现的局部更新时，才增加限定在结果区域内的 observer。

## 企业详情页

企业详情 URL 结构一致：

```text
/{year}/pc/search/corp{companyId}/{page}.html
```

`outline.html` 页面确认存在：

- `input[name="corpId"]`：企业数字 ID
- `input[name="corpName"]`：较干净的企业名称
- `h1`：可见企业名称，作为 fallback

页面中存在多个 `id="corpId"` 元素，违反 HTML ID 唯一性假设。实现因此使用 `input[name="corpId"]`，不依赖 `#corpId` 的唯一性。

身份解析顺序：

1. 从 URL 的 `/corp{digits}/` 提取 company ID。
2. 如果隐藏字段存在，检查它是否与 URL 一致。
3. 名称优先读取 `input[name="corpName"]`，其次读取可见 `h1`。
4. 任一关键身份发生冲突时跳过该页面，不抛出全局错误。

## 跨年度企业 ID

从 2028 食品行业结果页抽样 15 个 ID，并请求相同 ID 的 2027 `outline.html`：

- 15/15 均返回 HTTP 200。
- 15/15 均对应同一家企业。
- 14/15 名称完全相同。
- 1/15 只存在全角/半角括号差异。

已确认的样本包括 `72623`、`72687`、`66450`、`85142`、`91899`、`239641`、`78010`、`208646`、`60385`、`55713`、`216430`、`53759`、`100359`、`222439`、`1269`。

该结果说明 Mynavi 的企业 ID 在大量企业上可能跨年度稳定，但不能证明全部企业都稳定，也不能证明未来年度不会改变。因此 v0.1 仍使用年度隔离主键：

```text
${year}:${companyId}
```

例如 `27:66450` 与 `28:66450` 是两条独立记录，不自动传播 `viewed`、`candidate` 或 `pass` 状态。

## 两年度差异

- 2028 首页默认突出“インターンシップ＆キャリア”，企业搜索是独立入口；2027 首页直接突出求职企业搜索。
- 不同搜索入口产生的结果 endpoint 不完全一致。
- 相同企业的标题或介绍文案可能按年度变化。
- 核心企业卡片 DOM、详情 URL、企业 ID 格式和详情页身份字段在已测页面上一致。

因此使用共享 parser 和共享 DOM adapter，不创建年度专属脚本。

## 当前风险

- Mynavi 未提供供扩展依赖的公开 DOM API，class 和 route 未来可能调整。
- 调查覆盖公开 PC 页面，不包含登录后的个性化结果状态。
- 跨年度 ID 只做了抽样验证，不能用于自动合并用户状态。
- 尚未发现需要 `MutationObserver` 的流程；UI 实现后仍需重新验证搜索条件和分页行为。
