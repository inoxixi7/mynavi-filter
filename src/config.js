(function initializeConfig(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const config = Object.freeze({
    SUPPORTED_YEARS: Object.freeze(["27", "28"]),
    STORAGE_KEYS: Object.freeze({
      schemaVersion: "mynaviFilter:schemaVersion",
      settings: "mynaviFilter:settings",
      companyPrefix: "mynaviFilter:company:",
    }),
    SCHEMA_VERSION: 1,
    DEFAULT_SETTINGS: Object.freeze({
      hideViewed: false,
      hidePass: true,
    }),
    DEBUG: false,
  });

  namespace.config = config;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(globalThis);
