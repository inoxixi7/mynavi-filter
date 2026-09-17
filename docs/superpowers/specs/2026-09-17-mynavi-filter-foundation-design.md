# Mynavi Filter foundation design

Date: 2026-09-17

## Objective

Create the verified, no-build foundation for a Manifest V3 Chrome extension that supports the public Mynavi 2027 and 2028 PC sites. This milestone establishes URL parsing, company identity parsing, year-aware local storage, page routing, tested DOM adapters, documentation, and loadable extension scaffolding. It deliberately stops before injecting status buttons, filters, counters, or automatic `viewed` writes.

The extension must load directly through Chrome's “Load unpacked” workflow and must not use a framework, backend, account, analytics SDK, cloud sync, or build step.

## Verified website findings

The findings below were gathered from live pages on 2026-09-17.

### Search-result routes

Verified 2027 routes include:

- `/27/pc/search/query.html?...`
- `/27/pc/search/inc63.html`
- `/27/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage` after pagination

Verified 2028 routes include:

- `/28/pc/search/inc63.html`
- `/28/pc/corpinfo/displayCorpSearch/doSearch` after submitting search conditions
- `/28/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage` after pagination

The URL parser will recognize the verified route families without embedding either supported year in the route-matching logic. Year support is decided only by `SUPPORTED_YEARS`.

### Search-result DOM

The tested 2027 and 2028 result pages share the same important structure:

- Result container: `#contentsleft`
- Company card: `.boxSearchresultEach.corp`
- Card heading area: `.boxSearchresultEach_head`
- Company link/name: `.boxSearchresultEach_head h3 a`
- Example card ID: `div66450`
- Example company link: `/27/pc/search/corp66450/outline.html`
- Search results form: `#displaySearchCorpListByGenCondDispForm`

Both tested pages rendered 100 cards. PICK UP cards and ordinary cards used the same card class and heading structure. PICK UP is presentation text inside the heading, not a different container type.

The company link is the primary source for the company ID and name. The card's `div{id}` value is only a consistency fallback because the stable identifier is explicitly present in the company URL.

### Pagination and result replacement

Pagination uses a JavaScript link that submits `#displaySearchCorpListByGenCondDispForm` to a year-specific `doSpecifiedPage` route. The observed transition was a full POST navigation and produced a new document. Submitting 2028 search conditions likewise produced a full POST navigation.

No tested flow showed SPA-style replacement of the company-card list. The foundation therefore exposes idempotent page-processing entry points but does not install a `MutationObserver`. A later UI milestone may add a scoped observer only if live verification demonstrates partial result replacement.

### Company detail pages

Verified detail routes use:

`/{year}/pc/search/corp{companyId}/{page}.html`

For company `66450`, both live pages resolved successfully:

- `/27/pc/search/corp66450/outline.html`
- `/28/pc/search/corp66450/outline.html`

On both pages:

- `input[name="corpId"]` contains `66450`.
- `input[name="corpName"]` contains the normalized company name.
- The visible company heading is an `h1`.

The URL is the primary identity source. Hidden inputs are used for validation and metadata, with the visible heading as the company-name fallback. Duplicate `id="corpId"` elements exist, so code must query by `name` and must not assume ID uniqueness.

### Cross-year identity evidence

Fifteen company IDs sampled from the 2028 food-industry results all returned a 200 response at the corresponding 2027 `corp{id}` detail URL and represented the same company. Fourteen names matched exactly. One differed only in Japanese parenthesis typography.

This is evidence that many IDs are stable across these two years, but it is not proof that every company keeps the same ID. The v0.1 storage identity therefore remains `${year}:${companyId}` and no status is shared automatically between years.

## Architecture choice

The extension will use multiple classic content scripts loaded in manifest order. Each file publishes a small API beneath the single isolated-world namespace `globalThis.MynaviFilter`.

This approach is preferred over a monolithic content script because it keeps responsibilities separate, and over dynamic ES module imports because it avoids extra web-accessible resource and CSP complexity. It preserves the requested no-build workflow.

Planned load order:

1. `src/config.js`
2. `src/utils/mynavi-url.js`
3. `src/utils/company-id.js`
4. `src/storage/storage.js`
5. `src/content/search.js`
6. `src/content/company.js`
7. `src/content/main.js`

All modules must tolerate repeated evaluation and must not replace an existing namespace object.

## Components

### Configuration

`src/config.js` owns:

- `SUPPORTED_YEARS = ["27", "28"]`
- storage schema version
- default settings
- debug logging switch

Supported years must not appear elsewhere as business-logic branches.

### URL parser

`src/utils/mynavi-url.js` provides:

- `getMynaviYear(url)`
- `isSupportedYear(year)`
- `detectPageType(url)`
- `parseMynaviUrl(url)`

`parseMynaviUrl` returns a stable object containing hostname validity, parsed year, supported-year status, page type, pathname, and company ID when present. Page types for this milestone are `search-results`, `company`, and `other`.

An unverified future route such as `/29/pc/...` can still yield `year: "29"` and an inferred page type, but returns `supported: false` until configuration is updated after verification.

### Company identity parser

`src/utils/company-id.js` provides:

- `extractCompanyId(url)` using the verified `/corp{digits}/` segment
- `createCompanyKey(year, companyId)`
- `parseCompanyCard(card, baseUrl)`
- `parseCompanyPage(document, url)`

Parsers return `null` for missing or contradictory required identity data rather than throwing. Card parsing prefers the heading link. Detail parsing prefers the URL for identity, validates against `input[name="corpId"]`, and reads the company name from `input[name="corpName"]` with an `h1` fallback.

### Storage adapter

`src/storage/storage.js` is the only module that calls `chrome.storage.local`. It provides:

- `getCompany(year, companyId)`
- `setCompanyStatus(year, companyId, status, metadata)`
- `getCompaniesForYear(year)`
- `getSettings()`
- `setSettings(patch)`

The stored root object is:

```json
{
  "schemaVersion": 1,
  "companies": {
    "27:66450": {
      "year": "27",
      "companyId": "66450",
      "name": "株式会社例",
      "status": "viewed",
      "firstSeenAt": "ISO-8601 timestamp",
      "lastSeenAt": "ISO-8601 timestamp",
      "updatedAt": "ISO-8601 timestamp"
    }
  },
  "settings": {
    "hideViewed": false,
    "hidePass": true
  }
}
```

Only `viewed`, `candidate`, and `pass` are stored statuses. `unseen` is represented by the absence of a company record. Storage validates supported years, company IDs, and statuses before writing. Company records are never looked up by name.

### Page adapters and router

`src/content/search.js` exposes a read-only `inspectSearchPage(document, url)` result containing page context and parsed company cards. It uses the verified shared selectors and performs no UI injection in this milestone.

`src/content/company.js` exposes a read-only `inspectCompanyPage(document, url)` result containing year, company ID, and company name. It performs no automatic status write in this milestone.

`src/content/main.js` parses the current URL, exits immediately for unsupported years or unrelated pages, and invokes the appropriate read-only adapter. Parsed context is retained only inside the content-script isolated world. Normal operation produces no console output; debug mode may emit concise diagnostics.

## Manifest and permissions

`manifest.json` will use Manifest V3 and request only the `storage` permission. Static content scripts and CSS will match:

- `https://job.mynavi.jp/27/pc/*`
- `https://job.mynavi.jp/28/pc/*`

No `<all_urls>` permission, background worker, external request permission, popup, or web-accessible resource is needed for the foundation.

## Error handling

- Invalid URLs, unsupported years, missing cards, and missing identifiers are skipped without breaking the page.
- A malformed individual card does not prevent other cards from being parsed.
- Storage failures reject through the adapter boundary so later UI code can decide how to notify the user.
- Debug logging is disabled by default.
- No Mynavi links, entry controls, bookmark controls, or existing event handlers are modified.

## Testing and verification

The project uses Node's built-in test runner with no package dependency. Pure utilities publish CommonJS exports only when `module.exports` exists, allowing the same source files to run in Chrome and in tests.

Tests cover:

- supported and unsupported year parsing
- all verified result-route families
- company detail route parsing
- rejection of other hosts and malformed IDs
- company key generation and year isolation
- allowed stored statuses and `unseen` omission
- card parsing against minimal fixtures matching the verified DOM contract
- detail parsing with hidden-input and heading fallbacks

Verification for this milestone consists of:

1. JSON validation of `manifest.json`.
2. Passing Node tests.
3. Static confirmation that only `storage` permission and the two supported URL patterns are requested.
4. Loading the unpacked extension in Chrome without manifest or console errors.
5. Confirming read-only routing on one verified 2027 result/detail page and one verified 2028 result/detail page.

## Milestone file structure

```text
mynavi-filter/
├── manifest.json
├── README.md
├── docs/
│   ├── research/
│   │   └── mynavi-2027-2028-dom.md
│   └── superpowers/
│       └── specs/
│           └── 2026-09-17-mynavi-filter-foundation-design.md
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
└── tests/
    ├── company-id.test.js
    ├── fixtures.js
    ├── mynavi-url.test.js
    └── storage.test.js
```

## Out of scope for this milestone

- Card status controls
- Toolbar, counters, and filters
- Hiding `viewed` or `pass` cards
- Automatic `viewed` writes on detail pages
- Mutation observation
- Popup or dashboard
- Cross-year identity linking or status migration
- Export, import, sync, analytics, or backend services

## Completion criteria

The foundation is complete when the documented file structure exists, the unpacked extension is valid, all unit tests pass, the live-page adapters parse both supported years using shared code, and no user-facing filtering behavior has been added prematurely.
