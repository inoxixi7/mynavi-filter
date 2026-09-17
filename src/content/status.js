(function initializeStatus(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const VALID_STATUSES = new Set(["unseen", "viewed", "candidate", "pass"]);

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

  const api = { normalizeStatus, shouldHide, summarizeCards, resolveManualStatus };
  namespace.status = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
