(function initializeCompanyIdentity(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const mynaviUrl = namespace.url || require("./mynavi-url.js");

  function extractCompanyId(input) {
    return mynaviUrl.extractCompanyId(input);
  }

  function createCompanyKey(year, companyId) {
    if (!/^\d{2}$/.test(String(year))) {
      throw new TypeError("Invalid year");
    }
    if (!/^\d+$/.test(String(companyId))) {
      throw new TypeError("Invalid companyId");
    }

    return `${year}:${companyId}`;
  }

  function parseCompanyCard(card, baseUrl) {
    const link = card?.querySelector?.(".boxSearchresultEach_head h3 a");
    if (!link) {
      return null;
    }

    let href;
    try {
      href = new URL(link.getAttribute("href"), baseUrl).href;
    } catch {
      return null;
    }

    const parsed = mynaviUrl.parseMynaviUrl(href);
    if (!parsed.year || !parsed.companyId) {
      return null;
    }

    const firstText = link.childNodes?.[0]?.textContent;
    const name = String(firstText || link.textContent || "")
      .replace(/\s*PICK UP\s*$/, "")
      .trim();
    if (!name) {
      return null;
    }

    return {
      year: parsed.year,
      companyId: parsed.companyId,
      key: createCompanyKey(parsed.year, parsed.companyId),
      name,
      href,
    };
  }

  function parseCompanyPage(documentRef, pageUrl) {
    const parsed = mynaviUrl.parseMynaviUrl(pageUrl);
    if (parsed.pageType !== "company" || !parsed.year || !parsed.companyId) {
      return null;
    }

    const hiddenId = documentRef
      .querySelector('input[name="corpId"]')
      ?.value?.trim();
    if (hiddenId && hiddenId !== parsed.companyId) {
      return null;
    }

    const name = String(
      documentRef.querySelector('input[name="corpName"]')?.value ||
        documentRef.querySelector("h1")?.textContent ||
        "",
    ).trim();
    if (!name) {
      return null;
    }

    return {
      year: parsed.year,
      companyId: parsed.companyId,
      key: createCompanyKey(parsed.year, parsed.companyId),
      name,
    };
  }

  const api = {
    extractCompanyId,
    createCompanyKey,
    parseCompanyCard,
    parseCompanyPage,
  };

  namespace.company = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
