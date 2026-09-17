(function initializeRuntime(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});

  function routeCurrentPage(documentRef, pageUrl) {
    const parsed = namespace.url.parseMynaviUrl(pageUrl);
    if (!parsed.supported) {
      return null;
    }

    if (parsed.pageType === "search-results") {
      return namespace.search.inspectSearchPage(documentRef, pageUrl);
    }
    if (parsed.pageType === "company") {
      return namespace.companyPage.inspectCompanyPage(documentRef, pageUrl);
    }

    return null;
  }

  const runtime = (namespace.runtime = namespace.runtime || {});
  runtime.routeCurrentPage = routeCurrentPage;
  runtime.pageContext = null;

  if (typeof document !== "undefined" && typeof location !== "undefined") {
    try {
      runtime.pageContext = routeCurrentPage(document, location.href);
    } catch (error) {
      if (namespace.config.DEBUG) {
        console.debug("[Mynavi Filter] Page inspection failed", error);
      }
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = runtime;
  }
})(globalThis);
