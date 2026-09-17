(function initializeSearchAdapter(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});

  function inspectSearchPage(documentRef, pageUrl) {
    const parsed = namespace.url.parseMynaviUrl(pageUrl);
    if (!parsed.supported || parsed.pageType !== "search-results") {
      return null;
    }

    const cardElements = documentRef?.querySelectorAll?.(
      ".boxSearchresultEach.corp",
    );
    const cards = [...(cardElements || [])]
      .map((card) => namespace.company.parseCompanyCard(card, pageUrl))
      .filter(Boolean);

    return {
      pageType: "search-results",
      year: parsed.year,
      cards,
      cardCount: cards.length,
    };
  }

  const api = { inspectSearchPage };
  namespace.search = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
