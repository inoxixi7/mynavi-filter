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

  async function initializeCurrentPage(documentRef, pageUrl, options = {}) {
    const context = routeCurrentPage(documentRef, pageUrl);
    if (!context) return null;

    const storage = options.storage || namespace.storage;
    if (context.pageType === "company") {
      if (!storage?.markCompanyViewed) return context.company;
      return storage.markCompanyViewed(context.company.year, context.company.companyId, {
        name: context.company.name,
      });
    }

    if (context.pageType === "search-results") {
      if (!namespace.searchUI?.enhanceSearchPage) return context;
      return namespace.searchUI.enhanceSearchPage(documentRef, pageUrl, {
        ...options,
        storage,
      });
    }

    return context;
  }

  const runtime = (namespace.runtime = namespace.runtime || {});
  runtime.routeCurrentPage = routeCurrentPage;
  runtime.initializeCurrentPage = initializeCurrentPage;
  runtime.pageContext = null;

  if (typeof document !== "undefined" && typeof location !== "undefined") {
    runtime.pageContext = routeCurrentPage(document, location.href);
    initializeCurrentPage(document, location.href).catch((error) => {
      if (namespace.config.DEBUG) {
        console.debug("[Mynavi Filter] Page initialization failed", error);
      }
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = runtime;
  }
})(globalThis);
