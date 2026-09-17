# Mynavi Filter v0.1 Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unnecessary search-page observation, make company records independently writable, correct timestamp semantics, and add current-page status filters without expanding the product scope.

**Architecture:** Keep `chrome.storage.local` records split by settings/schema/company keys. Keep pure visibility rules in `status.js`, while `search-ui.js` owns the controller-local `activeFilter` and applies filter precedence during rendering. Search initialization runs one idempotent `process()` with no observer or timer.

**Tech Stack:** Manifest V3, vanilla JavaScript, `chrome.storage.local`, Node `node:test`, dependency-free DOM/storage fakes.

---

### Task 1: Storage key separation and timestamp semantics

**Files:**
- Modify: `src/config.js`, `src/storage/storage.js`
- Modify: `tests/storage.test.js`

- [x] Write failing tests for independent company keys, concurrent different-company writes, `createdAt`/`updatedAt`/`lastViewedAt`, and candidate/pass preservation on detail visits.
- [x] Run `node --test tests/storage.test.js` and confirm failures are caused by the old object storage and timestamp fields.
- [x] Implement schema/settings/company key helpers and read/write only the affected key; keep company reads year-scoped by prefix and preserve settings validation.
- [x] Run focused storage tests and then the full suite.

### Task 2: Disable search-page observer

**Files:**
- Modify: `src/content/search-ui.js`
- Modify: `tests/search-ui.test.js`

- [x] Add a failing test proving the default `enhanceSearchPage()` path does not construct or observe a `MutationObserver`.
- [x] Remove `observer`, `timer`, `observe` setup, and `destroy()` cleanup; keep `process()` idempotent and call it once during enhancement.
- [x] Run focused UI tests and verify repeated `controller.process()` still injects one toolbar and one controls group per card.

### Task 3: Add controller-local status filters

**Files:**
- Modify: `src/content/search-ui.js`, `src/content/status.js`, `src/content/styles.css`
- Modify: `tests/search-ui.test.js`, `tests/status.test.js`

- [x] Add failing tests for default `all`, candidate/unseen/viewed/pass filters, Pass visibility despite `hidePass`, restoring hide rules after All, and real counts staying unchanged.
- [x] Add toolbar filter buttons and a controller-local `activeFilter`; render uses the selected status only when a specific filter is active, otherwise shared hide settings.
- [x] Style the filter controls consistently with the existing toolbar and preserve the two hide-setting checkboxes.
- [x] Run focused UI/status tests and the full suite.

### Task 4: Final verification

**Files:**
- Modify: `README.md` only if storage/filter behavior is currently documented inaccurately.

- [x] Run `node --test tests/*.test.js`.
- [x] Run `node --check` for every JavaScript file under `src` and `tests`.
- [x] Run `git diff --check` and inspect the final diff for scope creep.
- [x] Report changed files, storage schema, concurrency strategy, filter precedence, tests, and remaining real-page checks.
