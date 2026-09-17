const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/config.js");
require("../src/utils/mynavi-url.js");
require("../src/utils/company-id.js");
const search = require("../src/content/search.js");
const companyPage = require("../src/content/company.js");
const runtime = require("../src/content/main.js");
const {
  createCard,
  createCompanyDocument,
  createSearchDocument,
} = require("./helpers.js");

const resultUrl = "https://job.mynavi.jp/28/pc/search/inc63.html";
const detailUrl = "https://job.mynavi.jp/28/pc/search/corp66450/outline.html";

test("search adapter returns only valid detected cards", () => {
  const validCard = createCard({
    href: "/28/pc/search/corp66450/outline.html",
    name: "Example Corp",
  });
  const invalidCard = createCard({});

  assert.deepEqual(
    search.inspectSearchPage(createSearchDocument([validCard, invalidCard]), resultUrl),
    {
      pageType: "search-results",
      year: "28",
      cards: [
        {
          year: "28",
          companyId: "66450",
          key: "28:66450",
          name: "Example Corp",
          href: detailUrl,
        },
      ],
      cardCount: 1,
    },
  );
});

test("company adapter returns verified detail context", () => {
  const documentRef = createCompanyDocument({
    companyId: "66450",
    companyName: "Example Corp",
  });

  assert.deepEqual(companyPage.inspectCompanyPage(documentRef, detailUrl), {
    pageType: "company",
    year: "28",
    company: {
      year: "28",
      companyId: "66450",
      key: "28:66450",
      name: "Example Corp",
    },
  });
});

test("adapters skip unsupported years", () => {
  assert.equal(
    search.inspectSearchPage(
      createSearchDocument([]),
      "https://job.mynavi.jp/29/pc/search/inc63.html",
    ),
    null,
  );
  assert.equal(
    companyPage.inspectCompanyPage(
      createCompanyDocument({ companyId: "66450", companyName: "Example Corp" }),
      "https://job.mynavi.jp/29/pc/search/corp66450/outline.html",
    ),
    null,
  );
});

test("router selects the matching read-only adapter", () => {
  const documentRef = createSearchDocument([
    createCard({
      href: "/28/pc/search/corp66450/outline.html",
      name: "Example Corp",
    }),
  ]);

  const context = runtime.routeCurrentPage(documentRef, resultUrl);

  assert.equal(context.pageType, "search-results");
  assert.equal(context.cardCount, 1);
  assert.equal(runtime.routeCurrentPage(documentRef, "https://job.mynavi.jp/28/pc/"), null);
});
