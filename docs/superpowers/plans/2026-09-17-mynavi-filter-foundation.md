# Mynavi Filter Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a directly loadable, read-only Manifest V3 extension foundation for verified Mynavi 2027 and 2028 search-result and company-detail pages.

**Architecture:** Load focused classic content scripts in manifest order and share APIs through `globalThis.MynaviFilter` in Chrome's isolated world. Keep URL parsing, company identity, storage, DOM inspection, and page routing independent; use Node's built-in test runner with dependency-free fakes for pure and adapter-level tests.

**Tech Stack:** Chrome Extension Manifest V3, vanilla JavaScript, HTML/CSS-free content foundation, `chrome.storage.local`, Node.js `node:test`.

---

## File map

- `manifest.json`: MV3 metadata, least-privilege storage permission, supported host matches, and ordered scripts.
- `src/config.js`: supported years, defaults, schema version, debug switch, and shared namespace initialization.
- `src/utils/mynavi-url.js`: URL validation, year parsing, page-type detection, and company ID extraction.
- `src/utils/company-id.js`: storage-key creation and DOM-to-company parsing.
- `src/storage/storage.js`: the only `chrome.storage.local` boundary and storage state transitions.
- `src/content/search.js`: read-only shared search-result DOM adapter.
- `src/content/company.js`: read-only company-detail DOM adapter.
- `src/content/main.js`: supported-page router.
- `src/content/styles.css`: reserved extension-owned style boundary; contains no active UI rules yet.
- `tests/helpers.js`: dependency-free fake DOM and storage helpers.
- `tests/mynavi-url.test.js`: URL parser coverage.
- `tests/company-id.test.js`: key, card, and detail identity coverage.
- `tests/storage.test.js`: storage defaults, validation, timestamps, and year isolation.
- `tests/content.test.js`: read-only adapter and router coverage.
- `docs/research/mynavi-2027-2028-dom.md`: live-page evidence and selector contract.
- `README.md`: purpose, privacy, supported pages, loading, test, and current-scope documentation.

### Task 1: Manifest and shared configuration

**Files:**
- Create: `manifest.json`
- Create: `src/config.js`
- Create: `src/content/styles.css`
- Test: `tests/config.test.js`

- [x] **Step 1: Write the failing configuration test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");

test("configuration centralizes supported years and defaults", () => {
  const config = require("../src/config.js");
  assert.deepEqual(config.SUPPORTED_YEARS, ["27", "28"]);
  assert.equal(config.STORAGE_KEY, "mynaviFilter");
  assert.deepEqual(config.DEFAULT_SETTINGS, {
    hideViewed: false,
    hidePass: true,
  });
  assert.equal(config.SCHEMA_VERSION, 1);
  assert.equal(config.DEBUG, false);
});
```

- [x] **Step 2: Run the test and verify the missing module failure**

Run: `node --test tests/config.test.js`

Expected: FAIL with `Cannot find module '../src/config.js'`.

- [x] **Step 3: Implement the shared configuration namespace**

```js
(function initializeConfig(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const config = Object.freeze({
    SUPPORTED_YEARS: Object.freeze(["27", "28"]),
    STORAGE_KEY: "mynaviFilter",
    SCHEMA_VERSION: 1,
    DEFAULT_SETTINGS: Object.freeze({ hideViewed: false, hidePass: true }),
    DEBUG: false,
  });

  namespace.config = config;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(globalThis);
```

Create `manifest.json` with this exact shape:

```json
{
  "manifest_version": 3,
  "name": "Mynavi Filter",
  "version": "0.1.0",
  "description": "マイナビ2027・2028の企業閲覧状態をローカルで整理します。",
  "permissions": ["storage"],
  "content_scripts": [
    {
      "matches": [
        "https://job.mynavi.jp/27/pc/*",
        "https://job.mynavi.jp/28/pc/*"
      ],
      "js": [
        "src/config.js",
        "src/utils/mynavi-url.js",
        "src/utils/company-id.js",
        "src/storage/storage.js",
        "src/content/search.js",
        "src/content/company.js",
        "src/content/main.js"
      ],
      "css": ["src/content/styles.css"],
      "run_at": "document_idle"
    }
  ]
}
```

Create `src/content/styles.css` containing only:

```css
/* Reserved for Mynavi Filter-owned UI in the next milestone. */
```

- [x] **Step 4: Validate configuration and manifest**

Run: `node --test tests/config.test.js && node -e 'JSON.parse(require("node:fs").readFileSync("manifest.json", "utf8")); console.log("manifest ok")'`

Expected: one passing test followed by `manifest ok`.

- [x] **Step 5: Commit the foundation metadata**

```bash
git add manifest.json src/config.js src/content/styles.css tests/config.test.js
git commit -m "chore: scaffold extension manifest"
```

### Task 2: URL parser

**Files:**
- Create: `src/utils/mynavi-url.js`
- Create: `tests/mynavi-url.test.js`

- [x] **Step 1: Write URL parser tests for every verified route family**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/config.js");
const url = require("../src/utils/mynavi-url.js");

const resultPages = [
  "https://job.mynavi.jp/27/pc/search/query.html?/LICM:1/",
  "https://job.mynavi.jp/27/pc/search/inc63.html",
  "https://job.mynavi.jp/27/pc/corpinfo/searchCorpListByGenCond/index/",
  "https://job.mynavi.jp/27/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage",
  "https://job.mynavi.jp/28/pc/search/inc63.html",
  "https://job.mynavi.jp/28/pc/corpinfo/displayCorpSearch/doSearch",
  "https://job.mynavi.jp/28/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage",
];

test("recognizes verified result routes", () => {
  for (const input of resultPages) {
    assert.equal(url.parseMynaviUrl(input).pageType, "search-results", input);
  }
});

test("extracts company page identity", () => {
  assert.deepEqual(
    url.parseMynaviUrl("https://job.mynavi.jp/28/pc/search/corp66450/outline.html"),
    {
      mynavi: true,
      supported: true,
      year: "28",
      pageType: "company",
      companyId: "66450",
      pathname: "/28/pc/search/corp66450/outline.html",
    },
  );
});

test("parses an unverified future year without enabling it", () => {
  const parsed = url.parseMynaviUrl("https://job.mynavi.jp/29/pc/search/inc63.html");
  assert.equal(parsed.year, "29");
  assert.equal(parsed.pageType, "search-results");
  assert.equal(parsed.supported, false);
});

test("rejects other hosts and malformed company IDs", () => {
  assert.equal(url.parseMynaviUrl("https://example.com/27/pc/search/inc63.html").mynavi, false);
  assert.equal(url.extractCompanyId("https://job.mynavi.jp/27/pc/search/corpABC/outline.html"), null);
});
```

- [x] **Step 2: Run tests and verify the missing module failure**

Run: `node --test tests/mynavi-url.test.js`

Expected: FAIL with `Cannot find module '../src/utils/mynavi-url.js'`.

- [x] **Step 3: Implement URL parsing without year-specific branches**

```js
(function initializeMynaviUrl(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const config = namespace.config || require("../config.js");
  const COMPANY_PATH = /^\/(\d{2})\/pc\/search\/corp(\d+)(?:\/|$)/;
  const RESULT_PATHS = [
    /^\/\d{2}\/pc\/search\/(?:query|inc\d+)\.html$/,
    /^\/\d{2}\/pc\/corpinfo\/searchCorpListByGenCond\/(?:index|doSpecifiedPage)\/?$/,
    /^\/\d{2}\/pc\/corpinfo\/displayCorpSearch\/doSearch\/?$/,
  ];

  function toUrl(input) {
    try {
      return new URL(input);
    } catch {
      return null;
    }
  }

  function getMynaviYear(input) {
    const parsed = toUrl(input);
    if (!parsed || parsed.hostname !== "job.mynavi.jp") return null;
    return parsed.pathname.match(/^\/(\d{2})\/pc(?:\/|$)/)?.[1] || null;
  }

  function isSupportedYear(year) {
    return config.SUPPORTED_YEARS.includes(String(year));
  }

  function extractCompanyId(input) {
    const parsed = toUrl(input);
    if (!parsed || parsed.hostname !== "job.mynavi.jp") return null;
    return parsed.pathname.match(COMPANY_PATH)?.[2] || null;
  }

  function detectPageType(input) {
    const parsed = toUrl(input);
    if (!parsed || parsed.hostname !== "job.mynavi.jp") return "other";
    if (COMPANY_PATH.test(parsed.pathname)) return "company";
    return RESULT_PATHS.some((pattern) => pattern.test(parsed.pathname))
      ? "search-results"
      : "other";
  }

  function parseMynaviUrl(input) {
    const parsed = toUrl(input);
    const mynavi = Boolean(parsed && parsed.hostname === "job.mynavi.jp");
    const year = mynavi ? getMynaviYear(parsed.href) : null;
    return {
      mynavi,
      supported: Boolean(year && isSupportedYear(year)),
      year,
      pageType: mynavi ? detectPageType(parsed.href) : "other",
      companyId: mynavi ? extractCompanyId(parsed.href) : null,
      pathname: parsed?.pathname || null,
    };
  }

  const api = { getMynaviYear, isSupportedYear, detectPageType, extractCompanyId, parseMynaviUrl };
  namespace.url = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
```

- [x] **Step 4: Run URL tests**

Run: `node --test tests/mynavi-url.test.js`

Expected: four passing tests.

- [x] **Step 5: Commit URL parsing**

```bash
git add src/utils/mynavi-url.js tests/mynavi-url.test.js
git commit -m "feat: add year-aware Mynavi URL parser"
```

### Task 3: Company identity and DOM adapters

**Files:**
- Create: `src/utils/company-id.js`
- Create: `src/content/search.js`
- Create: `src/content/company.js`
- Create: `src/content/main.js`
- Create: `tests/helpers.js`
- Create: `tests/company-id.test.js`
- Create: `tests/content.test.js`

- [x] **Step 1: Add dependency-free DOM fakes and failing identity tests**

`tests/helpers.js` must export small objects whose `querySelector` and `querySelectorAll` methods return explicit fixture nodes. `tests/company-id.test.js` must assert:

```js
assert.equal(company.createCompanyKey("27", "66450"), "27:66450");
assert.throws(() => company.createCompanyKey("27", "corp66450"), /companyId/);
assert.deepEqual(company.parseCompanyCard(card, "https://job.mynavi.jp/27/pc/search/inc63.html"), {
  year: "27",
  companyId: "66450",
  key: "27:66450",
  name: "(株)サンベルクスホールディングス【スーパーベルクス】",
  href: "https://job.mynavi.jp/27/pc/search/corp66450/outline.html",
});
assert.equal(company.parseCompanyPage(mismatchedDocument, detailUrl), null);
```

Run: `node --test tests/company-id.test.js`

Expected: FAIL because `src/utils/company-id.js` does not exist.

- [x] **Step 2: Implement identity parsing**

Implement `src/utils/company-id.js` with these exact public contracts:

```js
function createCompanyKey(year, companyId) {
  if (!/^\d{2}$/.test(String(year))) throw new TypeError("Invalid year");
  if (!/^\d+$/.test(String(companyId))) throw new TypeError("Invalid companyId");
  return `${year}:${companyId}`;
}

function parseCompanyCard(card, baseUrl) {
  const link = card?.querySelector?.(".boxSearchresultEach_head h3 a");
  if (!link) return null;
  const href = new URL(link.getAttribute("href"), baseUrl).href;
  const parsed = url.parseMynaviUrl(href);
  if (!parsed.year || !parsed.companyId) return null;
  const firstText = link.childNodes?.[0]?.textContent;
  const name = String(firstText || link.textContent || "").replace(/\s*PICK UP\s*$/, "").trim();
  if (!name) return null;
  return { year: parsed.year, companyId: parsed.companyId, key: createCompanyKey(parsed.year, parsed.companyId), name, href };
}

function parseCompanyPage(documentRef, pageUrl) {
  const parsed = url.parseMynaviUrl(pageUrl);
  if (parsed.pageType !== "company" || !parsed.year || !parsed.companyId) return null;
  const hiddenId = documentRef.querySelector('input[name="corpId"]')?.value?.trim();
  if (hiddenId && hiddenId !== parsed.companyId) return null;
  const name = (
    documentRef.querySelector('input[name="corpName"]')?.value ||
    documentRef.querySelector("h1")?.textContent ||
    ""
  ).trim();
  if (!name) return null;
  return { year: parsed.year, companyId: parsed.companyId, key: createCompanyKey(parsed.year, parsed.companyId), name };
}
```

Wrap these functions with the same namespace/CommonJS pattern used by earlier modules, and export `extractCompanyId` by delegating to `namespace.url.extractCompanyId`.

- [x] **Step 3: Run identity tests**

Run: `node --test tests/company-id.test.js`

Expected: all tests pass.

- [x] **Step 4: Write failing content adapter tests**

`tests/content.test.js` must verify that:

- `inspectSearchPage` returns only valid cards from `.boxSearchresultEach.corp`.
- `inspectCompanyPage` returns the parsed detail context.
- Unsupported year 29 returns `null` from both adapters.
- `routeCurrentPage` selects the matching adapter and stores the result at `MynaviFilter.runtime.pageContext`.

Run: `node --test tests/content.test.js`

Expected: FAIL because the content adapter modules do not exist.

- [x] **Step 5: Implement the read-only adapters and router**

`src/content/search.js`:

```js
function inspectSearchPage(documentRef, pageUrl) {
  const parsed = namespace.url.parseMynaviUrl(pageUrl);
  if (!parsed.supported || parsed.pageType !== "search-results") return null;
  const cards = [...documentRef.querySelectorAll(".boxSearchresultEach.corp")]
    .map((card) => namespace.company.parseCompanyCard(card, pageUrl))
    .filter(Boolean);
  return { pageType: "search-results", year: parsed.year, cards, cardCount: cards.length };
}
```

`src/content/company.js`:

```js
function inspectCompanyPage(documentRef, pageUrl) {
  const parsed = namespace.url.parseMynaviUrl(pageUrl);
  if (!parsed.supported || parsed.pageType !== "company") return null;
  const company = namespace.company.parseCompanyPage(documentRef, pageUrl);
  return company ? { pageType: "company", year: parsed.year, company } : null;
}
```

`src/content/main.js`:

```js
function routeCurrentPage(documentRef, pageUrl) {
  const parsed = namespace.url.parseMynaviUrl(pageUrl);
  if (!parsed.supported) return null;
  if (parsed.pageType === "search-results") return namespace.search.inspectSearchPage(documentRef, pageUrl);
  if (parsed.pageType === "company") return namespace.companyPage.inspectCompanyPage(documentRef, pageUrl);
  return null;
}

namespace.runtime = namespace.runtime || {};
namespace.runtime.routeCurrentPage = routeCurrentPage;
if (typeof document !== "undefined" && typeof location !== "undefined") {
  namespace.runtime.pageContext = routeCurrentPage(document, location.href);
}
```

Wrap each file in the established namespace/CommonJS pattern and keep debug output disabled unless `config.DEBUG` is true.

- [x] **Step 6: Run identity and adapter tests**

Run: `node --test tests/company-id.test.js tests/content.test.js`

Expected: all tests pass.

- [x] **Step 7: Commit company parsing and routing**

```bash
git add src/utils/company-id.js src/content/search.js src/content/company.js src/content/main.js tests/helpers.js tests/company-id.test.js tests/content.test.js
git commit -m "feat: add shared Mynavi page adapters"
```

### Task 4: Year-aware storage adapter

**Files:**
- Create: `src/storage/storage.js`
- Create: `tests/storage.test.js`

- [x] **Step 1: Write storage tests with a mocked `chrome.storage.local`**

Tests must exercise the public API and assert:

```js
assert.deepEqual(await storage.getSettings(), { hideViewed: false, hidePass: true });
await storage.setCompanyStatus("27", "66450", "viewed", { name: "Example" });
await storage.setCompanyStatus("28", "66450", "pass", { name: "Example" });
assert.equal((await storage.getCompany("27", "66450")).status, "viewed");
assert.equal((await storage.getCompany("28", "66450")).status, "pass");
assert.deepEqual(Object.keys(await storage.getCompaniesForYear("27")), ["27:66450"]);
await assert.rejects(storage.setCompanyStatus("27", "66450", "unseen"), /status/);
await assert.rejects(storage.setCompanyStatus("29", "66450", "viewed"), /year/);
assert.deepEqual(await storage.setSettings({ hideViewed: true, unknown: true }), {
  hideViewed: true,
  hidePass: true,
});
```

The mock must implement promise-returning `get(key)` and `set(object)` methods and retain data in memory.

Run: `node --test tests/storage.test.js`

Expected: FAIL because `src/storage/storage.js` does not exist.

- [x] **Step 2: Implement the storage boundary**

Implement a single-root record under `config.STORAGE_KEY`. Normalize missing data to:

```js
{
  schemaVersion: config.SCHEMA_VERSION,
  companies: {},
  settings: { ...config.DEFAULT_SETTINGS },
}
```

`setCompanyStatus(year, companyId, status, metadata = {})` must:

1. reject unsupported years;
2. reject IDs not matching `/^\d+$/`;
3. reject statuses outside `viewed`, `candidate`, and `pass`;
4. preserve an existing `firstSeenAt`;
5. update `lastSeenAt` and `updatedAt` to the same current ISO timestamp;
6. preserve the existing name when metadata omits it;
7. write through `chrome.storage.local` only in this module.

`setSettings(patch)` must accept only boolean `hideViewed` and `hidePass` fields and return the merged settings.

- [x] **Step 3: Run storage tests**

Run: `node --test tests/storage.test.js`

Expected: all tests pass.

- [x] **Step 4: Run the complete test suite**

Run: `node --test tests/*.test.js`

Expected: all tests pass with zero failures.

- [x] **Step 5: Commit storage support**

```bash
git add src/storage/storage.js tests/storage.test.js
git commit -m "feat: add year-aware local storage adapter"
```

### Task 5: Research report and README

**Files:**
- Create: `docs/research/mynavi-2027-2028-dom.md`
- Create: `README.md`

- [x] **Step 1: Write the live-page research report**

Document the exact evidence from the approved design:

- verified URL families for both years;
- `.boxSearchresultEach.corp`, `.boxSearchresultEach_head h3 a`, `#contentsleft`, and form selectors;
- 100 cards on each compared food-industry result page;
- PICK UP and regular cards sharing the same container structure;
- POST full navigation for pagination and search submission;
- detail-page hidden inputs and duplicate `id="corpId"` caveat;
- 15/15 cross-year sampled IDs resolving to the same company, with one typography-only name difference;
- the conclusion that storage remains year-scoped.

- [x] **Step 2: Write README usage and privacy documentation**

README must include:

```text
Supported: https://job.mynavi.jp/27/pc/* and https://job.mynavi.jp/28/pc/*
Storage: chrome.storage.local only
Cross-year behavior: company state is not shared
Load: chrome://extensions -> Developer mode -> Load unpacked -> select mynavi-filter
Test: node --test tests/*.test.js
Current milestone: read-only parsing foundation; no visible filtering UI yet
```

- [x] **Step 3: Check documentation for scope drift and placeholders**

Run: `rg -n 'TBD|TODO|FIXME|cloud sync|analytics' README.md docs/research/mynavi-2027-2028-dom.md`

Expected: no placeholders; cloud sync and analytics may appear only as explicit non-features/privacy statements.

- [x] **Step 4: Commit documentation**

```bash
git add README.md docs/research/mynavi-2027-2028-dom.md
git commit -m "docs: record verified Mynavi DOM contract"
```

### Task 6: Final validation

**Files:**
- Modify only if validation reveals a defect in the files above.

- [x] **Step 1: Run automated validation**

Run:

```bash
node --test tests/*.test.js
node -e 'const m=JSON.parse(require("node:fs").readFileSync("manifest.json", "utf8")); if (m.manifest_version !== 3 || m.permissions.join() !== "storage") process.exit(1); console.log("manifest ok")'
git diff --check
```

Expected: all tests pass, `manifest ok`, and `git diff --check` prints nothing.

- [x] **Step 2: Inspect permissions and year literals**

Run:

```bash
rg -n 'all_urls|host_permissions|https?://' manifest.json src
rg -n '"27"|"28"' src
```

Expected: no broad URL permission; the two URL patterns appear only in the manifest, and supported-year literals appear only in `src/config.js`.

- [x] **Step 3: Load the unpacked extension and verify live read-only routing**

In Chrome, open `chrome://extensions`, enable Developer mode, choose “Load unpacked,” and select the repository root. Confirm no manifest error. Open one verified result and detail page for each supported year and confirm that the extension context contains a non-null `MynaviFilter.runtime.pageContext` without altering Mynavi's visible DOM.

- [x] **Step 4: Record the final clean state**

Run: `git status --short && git log --oneline -6`

Expected: no uncommitted implementation files and a short sequence of focused commits ending with documentation or a validation fix.
