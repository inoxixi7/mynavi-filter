# Mynavi Filter Core Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the read-only foundation into a usable v0.1 loop: details record `viewed`, search cards expose status controls, and the current result page can count and hide cards using shared settings.

**Architecture:** Keep storage transitions in the storage adapter, pure status/count/filter rules in a small content module, and DOM mutation in a search UI controller. The controller is idempotent, uses the verified `.boxSearchresultEach.corp` contract, and stores only year-scoped company keys. The existing synchronous router remains available for tests while the browser entry point starts the async behavior.

**Tech Stack:** Manifest V3, vanilla JavaScript, `chrome.storage.local`, Node `node:test`, dependency-free DOM fakes.

---

### Task 1: Status rules and automatic viewed transition

**Files:**
- Modify: `src/storage/storage.js`
- Create: `src/content/status.js`
- Modify: `tests/storage.test.js`
- Create: `tests/status.test.js`

- [x] **Step 1: Write failing tests** for `markCompanyViewed`, same-status click behavior, summary counts, and hide rules.
- [x] **Step 2: Run only the new tests** and confirm they fail because the APIs do not exist.
- [x] **Step 3: Implement minimal status helpers and a storage `markCompanyViewed` method** that preserves existing `candidate`/`pass` statuses while updating metadata timestamps.
- [x] **Step 4: Run focused tests, then the full suite.**
- [x] **Step 5: Commit** `feat: add core status transitions`.

### Task 2: Search card controls and toolbar

**Files:**
- Create: `src/content/search-ui.js`
- Modify: `src/content/styles.css`
- Modify: `src/content/main.js`
- Modify: `manifest.json`
- Modify: `tests/helpers.js`
- Create: `tests/search-ui.test.js`

- [ ] **Step 1: Add failing controller tests** covering one toolbar, one controls group per card, default `hidePass`, current-page counts, button status updates, immediate hiding, and idempotent reprocessing.
- [ ] **Step 2: Run the new UI tests** and confirm the controller is missing.
- [ ] **Step 3: Implement the controller** with `data-mynavi-filter` markers, `button` event handlers that do not alter original links, async storage updates, scoped `MutationObserver` debouncing, and checkbox settings shared across years.
- [ ] **Step 4: Add restrained CSS** for the toolbar, buttons, selected state, and `.mynavi-filter-hidden { display: none !important; }`.
- [ ] **Step 5: Add the UI script to the manifest and start it from the supported search route in `main.js`.**
- [ ] **Step 6: Run the focused UI tests and the full suite.**
- [ ] **Step 7: Commit** `feat: add Mynavi search filtering UI`.

### Task 3: Company detail integration and verification

**Files:**
- Modify: `src/content/main.js`
- Modify: `README.md`
- Modify: `tests/content.test.js`

- [ ] **Step 1: Add a failing router integration test** that a supported detail page invokes the viewed transition and does not overwrite candidate/pass.
- [ ] **Step 2: Implement the async browser entry point** with error isolation and debug-only logging.
- [ ] **Step 3: Update README scope and loading notes** to describe the first usable behavior.
- [ ] **Step 4: Run all tests, syntax checks, manifest validation, and `git diff --check`.**
- [ ] **Step 5: Commit** `feat: connect detail viewed tracking`.

### Completion checks

- [ ] `node --test tests/*.test.js` passes with zero failures.
- [ ] Every `src` and `tests` JavaScript file passes `node --check`.
- [ ] `manifest.json` parses and contains only the existing `storage` permission.
- [ ] No supported-year business branch is duplicated outside `SUPPORTED_YEARS`.
- [ ] Search UI uses display hiding, not card removal, and can be re-run safely.
