(function initializeMynaviUrl(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const config = namespace.config || require("../config.js");
  const COMPANY_PATH = /^\/(\d{2})\/pc\/search\/corp(\d+)(?:\/|$)/;
  const RESULT_PATHS = [
    /^\/\d{2}\/pc\/search\/(?:query|inc\d+)\.html$/,
    /^\/\d{2}\/pc\/corpinfo\/searchCorpListByGenCond\/(?:index|doSpecifiedPage)\/?$/,
    /^\/\d{2}\/pc\/corpinfo\/displayCorpSearch\/doSearch\/?$/,
    /^\/\d{2}\/pc\/toppage\/displayTopPage\/doSearchSavedCond\/?$/,
  ];
  function toUrl(input) {
    try {
      return new URL(input);
    } catch {
      return null;
    }
  }

  function getMynaviYear(input) {
    const parsed = toUrl(input);
    if (!parsed || parsed.hostname !== "job.mynavi.jp") {
      return null;
    }

    return parsed.pathname.match(/^\/(\d{2})\/pc(?:\/|$)/)?.[1] || null;
  }

  function isSupportedYear(year) {
    return config.SUPPORTED_YEARS.includes(String(year));
  }

  function extractCompanyId(input) {
    const parsed = toUrl(input);
    if (!parsed || parsed.hostname !== "job.mynavi.jp") {
      return null;
    }

    return parsed.pathname.match(COMPANY_PATH)?.[2] || null;
  }

  function detectPageType(input) {
    const parsed = toUrl(input);
    if (!parsed || parsed.hostname !== "job.mynavi.jp") {
      return "other";
    }

    if (COMPANY_PATH.test(parsed.pathname)) {
      return "company";
    }

    return RESULT_PATHS.some((pattern) => pattern.test(parsed.pathname))
      ? "search-results"
      : "other";
  }

  function parseMynaviUrl(input) {
    const parsed = toUrl(input);
    const mynavi = Boolean(parsed && parsed.hostname === "job.mynavi.jp");
    const year = mynavi ? getMynaviYear(parsed.href) : null;

    return {
      mynavi,
      supported: Boolean(year && isSupportedYear(year)),
      year,
      pageType: mynavi ? detectPageType(parsed.href) : "other",
      companyId: mynavi ? extractCompanyId(parsed.href) : null,
      pathname: parsed?.pathname || null,
    };
  }

  const api = {
    getMynaviYear,
    isSupportedYear,
    detectPageType,
    extractCompanyId,
    parseMynaviUrl,
  };

  namespace.url = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
