# Mynavi Filter

[日本語](README.md) | [中文](README.zh-CN.md) | **English**

**Make Mynavi company search easier to organize.**

Mynavi Filter is a Chrome extension for the PC versions of **Mynavi 2027 and Mynavi 2028**. It adds lightweight local statuses such as Viewed, Interested, and Not interested to company search results.

It is designed mainly for students doing new-graduate job hunting in Japan, including international students.

When comparing many companies, it is easy to:

- forget whether you already checked a company,
- keep seeing companies you already decided to skip,
- lose track of companies you want to revisit,
- open the same company again after changing search conditions.

Mynavi Filter does not replace Mynavi's search functions. It adds a small organization layer on top of the existing results.

> This is currently a development version (v0.1) and is not yet available on the Chrome Web Store.

---

## Supported sites

Currently supported:

- Mynavi 2027  
  `https://job.mynavi.jp/27/pc/`
- Mynavi 2028  
  `https://job.mynavi.jp/28/pc/`

The year is detected automatically from the URL.

Company states for 2027 and 2028 are stored separately. Even when the same numeric company ID appears in both years, statuses are not automatically shared across years.

---

## Features

### 1. Organize companies with three statuses

Each company in the search results can be classified as:

| Status | Meaning |
| --- | --- |
| ✓ Viewed | You opened and checked the company detail page |
| ☆ Interested | A company you may want to revisit or apply to |
| × Not interested | A company you have decided to skip |

When you actually open a company detail page, an unclassified company is automatically marked as Viewed.

If a company is already marked Interested or Not interested, opening the detail page will not overwrite that manual choice.

---

### 2. Hide Viewed or Not interested companies

You can hide:

- Viewed companies
- Not interested companies

Hiding does not delete the stored record.

You can disable the hiding option or use the Not interested filter to review those companies later.

---

### 3. Filter the current result page by status

The floating Mynavi Filter menu lets you show:

- All
- Unchecked
- Interested
- Viewed
- Not interested

For example, selecting Interested lets you review only the companies you kept as possible candidates.

---

### 4. Current-page counts

The floating menu shows counts for:

- Unchecked
- Interested
- Viewed
- Not interested
- Hidden

These counts refer only to companies on the **current search-result page**, not all companies on Mynavi.

---

### 5. Live synchronization across tabs

If you open a company detail page in another tab, the search page listens for `chrome.storage.onChanged` events.

The original result page can update without a manual refresh:

- company status,
- Viewed counts,
- selected status buttons,
- hidden state.

When returning from a detail page with the browser Back button, the extension also refreshes stored state on `pageshow` to support Back/Forward Cache restoration.

---

## Basic workflow

1. Search for companies on Mynavi 2027 or 2028.
2. Open a company detail page.
3. Companies you actually open are automatically recorded as Viewed.
4. Click ☆ in the search results to mark a company as Interested.
5. Click × to mark it as Not interested.
6. Use the floating Mynavi Filter menu to filter or hide companies.

Example:

```text
100 companies in the results
↓
Check 30
↓
Mark 8 as Interested
↓
Mark 22 as Not interested
↓
Enable "Hide Not interested companies"
```

You can then continue searching without repeatedly reviewing companies you have already ruled out.

---

## Install the development version

The extension is not yet distributed through the Chrome Web Store.

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `mynavi-filter` repository directory.
6. Reload a supported Mynavi 2027 / 2028 page.

No npm installation or build step is required.

---

## Data and privacy

Mynavi Filter stores organization data locally using `chrome.storage.local`.

The current version has:

- no external data upload,
- no login,
- no user account,
- no cloud synchronization,
- no advertising SDK,
- no third-party analytics SDK.

Stored data may include:

- Mynavi year,
- company ID,
- company name,
- status (Viewed / Interested / Not interested),
- record creation time,
- update time,
- last viewed time.

Each company uses an independent storage key, for example:

```text
mynaviFilter:company:27:66450
mynaviFilter:company:28:66450
```

This reduces the risk of updates for different companies overwriting each other when several company pages are opened at once.

---

## 2027 and 2028 records

Records are separated by year.

For example:

```text
27:66450
28:66450
```

are treated as different records.

Testing found many cases where the same company ID points to the same company across 2027 and 2028, but this behavior is not guaranteed for every company or future year.

For that reason, the current version does not automatically synchronize Interested or Not interested states across years.

---

## What v0.1 does not do

The initial version intentionally stays focused. It does not currently provide:

- automatic applications,
- automatic Entry actions,
- automatic ES form filling,
- AI company evaluation,
- custom company crawling based on salary, holidays, location, etc.,
- bulk automatic visits to company pages,
- support for Recruit, Career-tasu, ONE CAREER, or other job sites,
- user accounts,
- cloud sync,
- paid plans or subscriptions.

The current goal is simple: **make large Mynavi search-result lists easier to manage.**

---

## Development

Technology:

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS
- `chrome.storage.local`
- Node.js `node:test`

No React or Vue is used.

Run tests:

```bash
node --test tests/*.test.js
```

Check JavaScript syntax:

```bash
find src tests -name "*.js" -print0 | xargs -0 -n1 node --check
```

Verified Mynavi DOM and URL research:

[`docs/research/mynavi-2027-2028-dom.md`](docs/research/mynavi-2027-2028-dom.md)

---

## Known limitations

Mynavi does not provide an official DOM API for this extension.

If Mynavi changes its:

- HTML structure,
- class names,
- URL structure,
- company-card markup,

some functionality may need to be updated.

The current implementation has been verified against real Mynavi 2027 and 2028 PC pages.

---

## Feedback

This project started from a real problem encountered during new-graduate job hunting: keeping large Mynavi search results organized.

Feedback is especially welcome from:

- students doing new-graduate job hunting in Japan,
- international students looking for jobs in Japan,
- job seekers comparing many companies.

Please use GitHub Issues for bug reports and improvement ideas.

---

## Disclaimer

Mynavi Filter is an independent, unofficial project and is not affiliated with or endorsed by Mynavi Corporation or its official services.

“Mynavi”, “マイナビ”, and related trademarks belong to their respective owners.
