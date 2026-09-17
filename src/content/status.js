(function initializeStatus(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const VALID_STATUSES = new Set(["unseen", "viewed", "candidate", "pass"]);
  const VALID_FILTERS = new Set(["all", "unseen", "candidate", "viewed", "pass"]);

  function normalizeStatus(status) {
    return VALID_STATUSES.has(status) ? status : "unseen";
  }

  function shouldHide(status, settings = {}) {
    const normalized = normalizeStatus(status);
    return (
      (normalized === "viewed" && settings.hideViewed === true) ||
      (normalized === "pass" && settings.hidePass === true)
    );
  }

  function normalizeFilter(filter) {
    return VALID_FILTERS.has(filter) ? filter : "all";
  }

  function shouldHideForFilter(status, settings = {}, activeFilter = "all") {
    const filter = normalizeFilter(activeFilter);
    if (filter !== "all") return normalizeStatus(status) !== filter;
    return shouldHide(status, settings);
  }

  function summarizeCards(cards, records = {}, settings = {}) {
    const summary = { unseen: 0, candidate: 0, viewed: 0, pass: 0, hidden: 0 };
    for (const card of cards || []) {
      const current = normalizeStatus(records[card.key]?.status);
      summary[current] += 1;
      if (shouldHide(current, settings)) {
        summary.hidden += 1;
      }
    }
    return summary;
  }

  function resolveManualStatus(currentStatus, targetStatus) {
    const current = normalizeStatus(currentStatus);
    const target = normalizeStatus(targetStatus);
    return current === target && target !== "unseen" ? "viewed" : target;
  }

  const api = {
    normalizeStatus,
    normalizeFilter,
    shouldHide,
    shouldHideForFilter,
    summarizeCards,
    resolveManualStatus,
  };
  namespace.status = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
