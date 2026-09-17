const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/config.js");
require("../src/utils/mynavi-url.js");
const company = require("../src/utils/company-id.js");
const { createCard, createCompanyDocument } = require("./helpers.js");

const resultUrl = "https://job.mynavi.jp/27/pc/search/inc63.html";
const detailUrl = "https://job.mynavi.jp/27/pc/search/corp66450/outline.html";

test("creates a year-scoped company key", () => {
  assert.equal(company.createCompanyKey("27", "66450"), "27:66450");
  assert.equal(company.createCompanyKey("28", "66450"), "28:66450");
  assert.throws(() => company.createCompanyKey("2027", "66450"), /year/);
  assert.throws(() => company.createCompanyKey("27", "corp66450"), /companyId/);
});

test("parses a result card from its verified heading link", () => {
  const card = createCard({
    href: "/27/pc/search/corp66450/outline.html",
    name: "(株)サンベルクスホールディングス【スーパーベルクス】",
    suffix: " PICK UP",
  });

  assert.deepEqual(company.parseCompanyCard(card, resultUrl), {
    year: "27",
    companyId: "66450",
    key: "27:66450",
    name: "(株)サンベルクスホールディングス【スーパーベルクス】",
    href: detailUrl,
  });
});

test("skips a malformed result card", () => {
  assert.equal(company.parseCompanyCard(createCard({}), resultUrl), null);
  assert.equal(
    company.parseCompanyCard(
      createCard({ href: "/27/pc/search/corpABC/outline.html", name: "Bad" }),
      resultUrl,
    ),
    null,
  );
});

test("parses and validates a detail page", () => {
  const documentRef = createCompanyDocument({
    companyId: "66450",
    companyName: "(株)サンベルクスホールディングス【スーパーベルクス】",
  });

  assert.deepEqual(company.parseCompanyPage(documentRef, detailUrl), {
    year: "27",
    companyId: "66450",
    key: "27:66450",
    name: "(株)サンベルクスホールディングス【スーパーベルクス】",
  });
});

test("uses the visible heading only when the hidden company name is absent", () => {
  const documentRef = createCompanyDocument({
    companyId: "66450",
    heading: " Example Corp ",
  });

  assert.equal(company.parseCompanyPage(documentRef, detailUrl).name, "Example Corp");
});

test("rejects contradictory or incomplete detail identity", () => {
  assert.equal(
    company.parseCompanyPage(
      createCompanyDocument({ companyId: "99999", companyName: "Wrong" }),
      detailUrl,
    ),
    null,
  );
  assert.equal(
    company.parseCompanyPage(createCompanyDocument({ companyId: "66450" }), detailUrl),
    null,
  );
});
