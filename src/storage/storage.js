(function initializeStorage(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const config = namespace.config || require("../config.js");
  const companyIdentity = namespace.company || require("../utils/company-id.js");
  const STORED_STATUSES = new Set(["viewed", "candidate", "pass"]);

  function createDefaultState() {
    return {
      schemaVersion: config.SCHEMA_VERSION,
      companies: {},
      settings: { ...config.DEFAULT_SETTINGS },
    };
  }

  function normalizeState(value) {
    const state = value && typeof value === "object" ? value : {};
    const storedSettings =
      state.settings && typeof state.settings === "object"
        ? state.settings
        : {};

    return {
      schemaVersion: config.SCHEMA_VERSION,
      companies:
        state.companies && typeof state.companies === "object"
          ? { ...state.companies }
          : {},
      settings: {
        hideViewed:
          typeof storedSettings.hideViewed === "boolean"
            ? storedSettings.hideViewed
            : config.DEFAULT_SETTINGS.hideViewed,
        hidePass:
          typeof storedSettings.hidePass === "boolean"
            ? storedSettings.hidePass
            : config.DEFAULT_SETTINGS.hidePass,
      },
    };
  }

  function getStorageArea() {
    const storageArea = root.chrome?.storage?.local;
    if (!storageArea) {
      throw new Error("chrome.storage.local is unavailable");
    }
    return storageArea;
  }

  async function readState() {
    const result = await getStorageArea().get(config.STORAGE_KEY);
    return normalizeState(result[config.STORAGE_KEY]);
  }

  async function writeState(state) {
    await getStorageArea().set({
      [config.STORAGE_KEY]: normalizeState(state),
    });
  }

  function validateIdentity(year, companyId) {
    if (!config.SUPPORTED_YEARS.includes(String(year))) {
      throw new TypeError("Invalid or unsupported year");
    }
    if (!/^\d+$/.test(String(companyId))) {
      throw new TypeError("Invalid companyId");
    }
  }

  async function getCompany(year, companyId) {
    validateIdentity(year, companyId);
    const state = await readState();
    const key = companyIdentity.createCompanyKey(String(year), String(companyId));
    return state.companies[key] || null;
  }

  async function setCompanyStatus(year, companyId, status, metadata = {}) {
    validateIdentity(year, companyId);
    if (!STORED_STATUSES.has(status)) {
      throw new TypeError("Invalid stored status");
    }

    const normalizedYear = String(year);
    const normalizedCompanyId = String(companyId);
    const key = companyIdentity.createCompanyKey(
      normalizedYear,
      normalizedCompanyId,
    );
    const state = await readState();
    const existing = state.companies[key] || null;
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
      firstSeenAt: existing?.firstSeenAt || now,
      lastSeenAt: now,
      updatedAt: now,
    };

    state.companies[key] = company;
    await writeState(state);
    return company;
  }

  async function markCompanyViewed(year, companyId, metadata = {}) {
    validateIdentity(year, companyId);

    const normalizedYear = String(year);
    const normalizedCompanyId = String(companyId);
    const key = companyIdentity.createCompanyKey(
      normalizedYear,
      normalizedCompanyId,
    );
    const state = await readState();
    const existing = state.companies[key] || null;
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
      firstSeenAt: existing?.firstSeenAt || now,
      lastSeenAt: now,
      updatedAt: now,
    };

    state.companies[key] = company;
    await writeState(state);
    return company;
  }

  async function getCompaniesForYear(year) {
    if (!config.SUPPORTED_YEARS.includes(String(year))) {
      throw new TypeError("Invalid or unsupported year");
    }

    const normalizedYear = String(year);
    const state = await readState();
    return Object.fromEntries(
      Object.entries(state.companies).filter(
        ([, company]) => company?.year === normalizedYear,
      ),
    );
  }

  async function getSettings() {
    const state = await readState();
    return { ...state.settings };
  }

  async function setSettings(patch = {}) {
    const state = await readState();

    for (const key of ["hideViewed", "hidePass"]) {
      if (typeof patch[key] === "boolean") {
        state.settings[key] = patch[key];
      }
    }

    await writeState(state);
    return { ...state.settings };
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
