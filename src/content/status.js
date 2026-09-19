(function initializeStatus(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const VALID_STATUSES = new Set(["unseen", "viewed", "candidate", "pass"]);
  const VALID_FILTERS = new Set([
    "all",
    "unseen",
    "candidate",
    "viewed",
    "pass",
  ]);

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

  function shouldHideForFilter(
    status,
    settings = {},
    activeFilter = "all",
  ) {
    const filter = normalizeFilter(activeFilter);
    const normalized = normalizeStatus(status);

    // 指定了某个状态筛选时，
    // 只显示该状态，不再受 hideViewed / hidePass 影响。
    if (filter !== "all") {
      return normalized !== filter;
    }

    // All 模式下遵守普通隐藏设置。
    return shouldHide(normalized, settings);
  }

  function summarizeCards(
    cards,
    records = {},
    settings = {},
    activeFilter = "all",
  ) {
    const summary = {
      unseen: 0,
      candidate: 0,
      viewed: 0,
      pass: 0,
      hidden: 0,
    };

    for (const card of cards || []) {
      const current = normalizeStatus(records[card.key]?.status);

      // 状态数量始终统计真实分布，
      // 不受当前筛选条件影响。
      summary[current] += 1;

      // hidden 表示“当前实际上被隐藏的企业数量”。
      if (
        shouldHideForFilter(
          current,
          settings,
          activeFilter,
        )
      ) {
        summary.hidden += 1;
      }
    }

    return summary;
  }

  function resolveManualStatus(currentStatus, targetStatus) {
    const current = normalizeStatus(currentStatus);
    const target = normalizeStatus(targetStatus);

    return current === target && target !== "unseen"
      ? "viewed"
      : target;
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