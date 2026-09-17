(function initializeStorage(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const config = namespace.config || require("../config.js");
  const companyIdentity = namespace.company || require("../utils/company-id.js");
  const STORED_STATUSES = new Set(["viewed", "candidate", "pass"]);
  const STORAGE_KEYS = config.STORAGE_KEYS;

  function getStorageArea() {
    const storageArea = root.chrome?.storage?.local;
    if (!storageArea) {
      throw new Error("chrome.storage.local is unavailable");
    }
    return storageArea;
  }

  function validateIdentity(year, companyId) {
    if (!config.SUPPORTED_YEARS.includes(String(year))) {
      throw new TypeError("Invalid or unsupported year");
    }
    if (!/^\d+$/.test(String(companyId))) {
      throw new TypeError("Invalid companyId");
    }
  }

  function companyStorageKey(year, companyId) {
    return `${STORAGE_KEYS.companyPrefix}${companyIdentity.createCompanyKey(year, companyId)}`;
  }

  function normalizeSettings(value) {
    const storedSettings = value && typeof value === "object" ? value : {};
    return {
      hideViewed:
        typeof storedSettings.hideViewed === "boolean"
          ? storedSettings.hideViewed
          : config.DEFAULT_SETTINGS.hideViewed,
      hidePass:
        typeof storedSettings.hidePass === "boolean"
          ? storedSettings.hidePass
          : config.DEFAULT_SETTINGS.hidePass,
    };
  }

  async function getCompany(year, companyId) {
    validateIdentity(year, companyId);
    const key = companyStorageKey(String(year), String(companyId));
    const result = await getStorageArea().get(key);
    return result[key] || null;
  }

  async function setCompanyStatus(year, companyId, status, metadata = {}) {
    validateIdentity(year, companyId);
    if (!STORED_STATUSES.has(status)) {
      throw new TypeError("Invalid stored status");
    }

    const normalizedYear = String(year);
    const normalizedCompanyId = String(companyId);
    const key = companyStorageKey(normalizedYear, normalizedCompanyId);
    const result = await getStorageArea().get(key);
    const existing = result[key] || null;
    const now = new Date().toISOString();
    const name =
      typeof metadata.name === "string" && metadata.name.trim()
        ? metadata.name.trim()
        : existing?.name || "";
    const company = {
      year: normalizedYear,
      companyId: normalizedCompanyId,
      name,
      status,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    if (existing?.lastViewedAt) company.lastViewedAt = existing.lastViewedAt;

    await getStorageArea().set({
      [STORAGE_KEYS.schemaVersion]: config.SCHEMA_VERSION,
      [key]: company,
    });
    return company;
  }

  async function markCompanyViewed(year, companyId, metadata = {}) {
    validateIdentity(year, companyId);

    const normalizedYear = String(year);
    const normalizedCompanyId = String(companyId);
    const key = companyStorageKey(normalizedYear, normalizedCompanyId);
    const result = await getStorageArea().get(key);
    const existing = result[key] || null;
    const now = new Date().toISOString();
    const name =
      typeof metadata.name === "string" && metadata.name.trim()
        ? metadata.name.trim()
        : existing?.name || "";
    const status =
      existing?.status === "candidate" || existing?.status === "pass"
        ? existing.status
        : "viewed";
    const company = {
      year: normalizedYear,
      companyId: normalizedCompanyId,
      name,
      status,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      lastViewedAt: now,
    };

    await getStorageArea().set({
      [STORAGE_KEYS.schemaVersion]: config.SCHEMA_VERSION,
      [key]: company,
    });
    return company;
  }

  async function getCompaniesForYear(year) {
    if (!config.SUPPORTED_YEARS.includes(String(year))) {
      throw new TypeError("Invalid or unsupported year");
    }

    const normalizedYear = String(year);
    const prefix = STORAGE_KEYS.companyPrefix;
    const allValues = await getStorageArea().get(null);
    return Object.fromEntries(
      Object.entries(allValues).flatMap(([key, company]) => {
        if (!key.startsWith(prefix) || company?.year !== normalizedYear) return [];
        const identityKey = companyIdentity.createCompanyKey(
          company.year,
          company.companyId,
        );
        return [[identityKey, company]];
      }),
    );
  }

  async function getSettings() {
    const result = await getStorageArea().get(STORAGE_KEYS.settings);
    return normalizeSettings(result[STORAGE_KEYS.settings]);
  }

  async function setSettings(patch = {}) {
    const current = await getSettings();
    const settings = { ...current };
    for (const key of ["hideViewed", "hidePass"]) {
      if (typeof patch[key] === "boolean") settings[key] = patch[key];
    }

    await getStorageArea().set({
      [STORAGE_KEYS.schemaVersion]: config.SCHEMA_VERSION,
      [STORAGE_KEYS.settings]: settings,
    });
    return { ...settings };
  }

  const api = {
    getCompany,
    setCompanyStatus,
    markCompanyViewed,
    getCompaniesForYear,
    getSettings,
    setSettings,
  };

  namespace.storage = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
