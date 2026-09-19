const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/config.js");
const mynaviUrl = require("../src/utils/mynavi-url.js");

const resultPages = [
  "https://job.mynavi.jp/27/pc/search/query.html?/LICM:1/",
  "https://job.mynavi.jp/27/pc/search/inc63.html",
  "https://job.mynavi.jp/27/pc/corpinfo/searchCorpListByGenCond/index/",
  "https://job.mynavi.jp/27/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage",
  "https://job.mynavi.jp/27/pc/toppage/displayTopPage/doSearchSavedCond",

  "https://job.mynavi.jp/28/pc/search/inc63.html",
  "https://job.mynavi.jp/28/pc/corpinfo/displayCorpSearch/doSearch",
  "https://job.mynavi.jp/28/pc/corpinfo/searchCorpListByGenCond/doSpecifiedPage",
  "https://job.mynavi.jp/28/pc/toppage/displayTopPage/doSearchSavedCond",
];

test("recognizes every verified search-result route family", () => {
  for (const input of resultPages) {
    assert.equal(mynaviUrl.detectPageType(input), "search-results", input);
    assert.equal(mynaviUrl.parseMynaviUrl(input).pageType, "search-results", input);
  }
});

test("extracts supported year and company identity", () => {
  const input = "https://job.mynavi.jp/28/pc/search/corp66450/outline.html";

  assert.equal(mynaviUrl.getMynaviYear(input), "28");
  assert.equal(mynaviUrl.isSupportedYear("28"), true);
  assert.equal(mynaviUrl.extractCompanyId(input), "66450");
  assert.deepEqual(mynaviUrl.parseMynaviUrl(input), {
    mynavi: true,
    supported: true,
    year: "28",
    pageType: "company",
    companyId: "66450",
    pathname: "/28/pc/search/corp66450/outline.html",
  });
});

test("parses an unverified future year without enabling it", () => {
  const parsed = mynaviUrl.parseMynaviUrl(
    "https://job.mynavi.jp/29/pc/search/inc63.html",
  );

  assert.equal(parsed.year, "29");
  assert.equal(parsed.pageType, "search-results");
  assert.equal(parsed.supported, false);
});

test("classifies search forms and unrelated Mynavi pages as other", () => {
  assert.equal(
    mynaviUrl.detectPageType(
      "https://job.mynavi.jp/28/pc/corpinfo/displayCorpSearch/index?tab=corp",
    ),
    "other",
  );
  assert.equal(
    mynaviUrl.detectPageType("https://job.mynavi.jp/28/pc/"),
    "other",
  );
});

test("rejects other hosts, invalid URLs, and malformed company IDs", () => {
  assert.deepEqual(mynaviUrl.parseMynaviUrl("not a url"), {
    mynavi: false,
    supported: false,
    year: null,
    pageType: "other",
    companyId: null,
    pathname: null,
  });
  assert.equal(
    mynaviUrl.parseMynaviUrl("https://example.com/27/pc/search/inc63.html").mynavi,
    false,
  );
  assert.equal(
    mynaviUrl.extractCompanyId(
      "https://job.mynavi.jp/27/pc/search/corpABC/outline.html",
    ),
    null,
  );
});
