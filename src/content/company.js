(function initializeCompanyPageAdapter(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});

  function inspectCompanyPage(documentRef, pageUrl) {
    const parsed = namespace.url.parseMynaviUrl(pageUrl);
    if (!parsed.supported || parsed.pageType !== "company") {
      return null;
    }

    const company = namespace.company.parseCompanyPage(documentRef, pageUrl);
    if (!company) {
      return null;
    }

    return {
      pageType: "company",
      year: parsed.year,
      company,
    };
  }

  const api = { inspectCompanyPage };
  namespace.companyPage = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
