(function initializeSearchUi(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const CARD_SELECTOR = ".boxSearchresultEach.corp";
  const LABELS = Object.freeze({
    viewed: "閲覧済み",
    candidate: "興味あり",
    pass: "興味なし",
  });
  const ICONS = Object.freeze({
    viewed: "✓",
    candidate: "☆",
    pass: "×",
  });
  const STAT_LABELS = Object.freeze({
    unseen: "未確認",
    candidate: "興味あり",
    viewed: "閲覧済み",
    pass: "興味なし",
    hidden: "非表示",
  });
  const SETTING_LABELS = Object.freeze({
    hideViewed: "閲覧済みを隠す",
    hidePass: "興味なし企業を隠す",
  });
  const FILTER_LABELS = Object.freeze({
    all: "すべて",
    unseen: "未確認",
    candidate: "興味あり",
    viewed: "閲覧済み",
    pass: "興味なし",
  });
  const STORAGE_KEYS = namespace.config?.STORAGE_KEYS || {
    settings: "mynaviFilter:settings",
    companyPrefix: "mynaviFilter:company:",
  };

  function reportError(message, error) {
    if (namespace.config?.DEBUG) {
      console.debug(`[Mynavi Filter] ${message}`, error);
    }
  }

  function append(parent, ...children) {
    if (typeof parent.append === "function") parent.append(...children);
    else children.forEach((child) => parent.appendChild(child));
  }

  function createToolbar(documentRef, settings, onSettingChange, onFilterChange) {
    const toolbar = documentRef.createElement("section");
    toolbar.setAttribute("data-mynavi-filter", "toolbar");
    toolbar.classList.add("mynavi-filter-toolbar");

    const panelId = "mynavi-filter-panel";
    const toggle = documentRef.createElement("button");
    toggle.type = "button";
    toggle.classList.add("mynavi-filter-toggle");
    toggle.textContent = "🔎";
    toggle.setAttribute("aria-controls", panelId);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Mynavi Filterを開く");
    toggle.setAttribute("title", "Mynavi Filter");

    const panel = documentRef.createElement("div");
    panel.classList.add("mynavi-filter-panel");
    panel.setAttribute("id", panelId);

    const title = documentRef.createElement("strong");
    title.textContent = "Mynavi Filter";
    title.classList.add("mynavi-filter-title");

    const summary = documentRef.createElement("div");
    summary.classList.add("mynavi-filter-summary");
    for (const key of ["unseen", "candidate", "viewed", "pass", "hidden"]) {
      const item = documentRef.createElement("span");
      item.classList.add("mynavi-filter-stat");
      item.setAttribute("data-stat", key);
      const label = documentRef.createElement("span");
      label.textContent = STAT_LABELS[key];
      const value = documentRef.createElement("b");
      value.textContent = "0";
      item.append(label, value);
      append(summary, item);
    }
    const settingsRow = documentRef.createElement("div");
    settingsRow.classList.add("mynavi-filter-settings");
    const syncSetting = (label, input, checked) => {
      input.checked = checked;
      input.setAttribute("aria-checked", String(checked));
      label.classList.toggle("is-selected", checked);
    };
    for (const [key, labelText] of Object.entries(SETTING_LABELS)) {
      const label = documentRef.createElement("label");
      label.classList.add("mynavi-filter-setting");
      const input = documentRef.createElement("input");
      input.type = "checkbox";
      input.setAttribute("data-setting", key);
      syncSetting(label, input, settings[key] === true);
      input.addEventListener("change", (event) => {
        const checked = Boolean(event.target.checked);
        syncSetting(label, input, checked);
        Promise.resolve(onSettingChange(key, checked)).catch((error) =>
          reportError("Setting update failed", error),
        );
      });
      const text = documentRef.createElement("span");
      text.textContent = labelText;
      append(label, input, text);
      append(settingsRow, label);
    }
    const filtersRow = documentRef.createElement("div");
    filtersRow.classList.add("mynavi-filter-filters");
    for (const [filter, labelText] of Object.entries(FILTER_LABELS)) {
      const button = documentRef.createElement("button");
      button.type = "button";
      button.classList.add("mynavi-filter-filter");
      button.setAttribute("data-filter", filter);
      button.setAttribute("aria-pressed", String(filter === "all"));
      button.textContent = labelText;
      button.addEventListener("click", () => {
        Promise.resolve(onFilterChange?.(filter)).catch((error) =>
          reportError("Filter update failed", error),
        );
      });
      append(filtersRow, button);
    }
    const panelHeader = documentRef.createElement("div");
    panelHeader.classList.add("mynavi-filter-panel-header");
    append(panelHeader, title, summary);
    append(panel, panelHeader, filtersRow, settingsRow);

    let pinnedOpen = false;
    const setOpen = (open) => {
      toolbar.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", `Mynavi Filterを${open ? "閉じる" : "開く"}`);
    };
    toggle.addEventListener("click", () => {
      pinnedOpen = !pinnedOpen;
      setOpen(pinnedOpen);
    });

    append(toolbar, toggle, panel);
    return toolbar;
  }

  function updateToolbar(toolbar, summary, settings, activeFilter = "all") {
    for (const key of ["unseen", "candidate", "viewed", "pass", "hidden"]) {
      const item = toolbar.querySelector(`[data-stat="${key}"]`);
      const value = item?.querySelector?.("b");
      if (value) value.textContent = String(summary[key]);
    }
    for (const key of Object.keys(SETTING_LABELS)) {
      const input = toolbar.querySelector(`input[data-setting="${key}"]`);
      if (input) {
        const checked = settings[key] === true;
        input.checked = checked;
        input.setAttribute("aria-checked", String(checked));
        input.parentNode?.classList?.toggle("is-selected", checked);
      }
    }
    const normalizedFilter = namespace.status.normalizeFilter(activeFilter);
    for (const filter of Object.keys(FILTER_LABELS)) {
      const button = toolbar.querySelector(`button[data-filter="${filter}"]`);
      if (button) {
        const selected = filter === normalizedFilter;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
    }
  }

  function ensureToolbar(
    container,
    documentRef,
    settings,
    onSettingChange,
    onFilterChange,
  ) {
    const host = documentRef.body || documentRef.querySelector?.("body") || container;
    const existing =
      host.querySelector?.('[data-mynavi-filter="toolbar"]') ||
      container.querySelector('[data-mynavi-filter="toolbar"]');
    if (existing) return existing;
    const toolbar = createToolbar(
      documentRef,
      settings,
      onSettingChange,
      onFilterChange,
    );
    if (typeof host.prepend === "function") host.prepend(toolbar);
    else host.insertBefore(toolbar, host.firstChild || null);
    return toolbar;
  }

  function ensureCardControls(documentRef, card, identity, onStatusClick) {
    const heading = card.querySelector?.(".boxSearchresultEach_head h3");
    const target = heading || card;
    heading?.classList?.add?.("mynavi-filter-heading");
    let controls = card.querySelector('[data-mynavi-filter="controls"]');
    if (!controls) {
      controls = documentRef.createElement("div");
      controls.setAttribute("data-mynavi-filter", "controls");
      controls.classList.add("mynavi-filter-controls");
      for (const [status, labelText] of Object.entries(LABELS)) {
        const button = documentRef.createElement("button");
        button.type = "button";
        button.textContent = ICONS[status];
        button.setAttribute("aria-label", labelText);
        button.setAttribute("title", labelText);
        button.setAttribute("data-status", status);
        button.classList.add("mynavi-filter-status-button", `mynavi-filter-status-${status}`);
        button.addEventListener("click", (event) => {
          event.preventDefault?.();
          event.stopPropagation?.();
          return Promise.resolve(onStatusClick(identity, status)).catch((error) =>
            reportError("Status update failed", error),
          );
        });
        append(controls, button);
      }
      append(target, controls);
    } else if (controls.parentNode !== target) {
      append(target, controls);
    }
    controls.dataset.companyKey = identity.key;
    return controls;
  }

  function updateCard(card, controls, status, settings, activeFilter) {
    if (!controls) return;
    for (const button of controls.querySelectorAll("button[data-status]")) {
      const selected = button.dataset.status === status;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    card.classList.toggle(
      "mynavi-filter-hidden",
      namespace.status.shouldHideForFilter(status, settings, activeFilter),
    );
    card.setAttribute("data-mynavi-filter-status", status);
  }

  function normalizeStorageSettings(value) {
    const defaults = namespace.config?.DEFAULT_SETTINGS || {
      hideViewed: false,
      hidePass: true,
    };
    const settings = value && typeof value === "object" ? value : {};
    return {
      hideViewed:
        typeof settings.hideViewed === "boolean"
          ? settings.hideViewed
          : defaults.hideViewed,
      hidePass:
        typeof settings.hidePass === "boolean" ? settings.hidePass : defaults.hidePass,
    };
  }

  function createController(documentRef, pageUrl, storage) {
    const container = documentRef.querySelector("#contentsleft");
    const controller = {
      documentRef,
      pageUrl,
      storage,
      container,
      settings: null,
      records: {},
      toolbar: null,
      activeFilter: "all",
      cardViews: [],
      year: null,
      storageChangeListener: null,
      pageshowListener: null,
      syncListenersInstalled: false,
      async handleSettingChange(key, value) {
        controller.settings = await storage.setSettings({ [key]: value });
        await controller.process();
      },
      async handleFilterChange(filter) {
        controller.activeFilter = namespace.status.normalizeFilter(filter);
        return controller.render();
      },
      async handleStatusClick(identity, targetStatus) {
        const currentStatus = controller.records[identity.key]?.status || "unseen";
        const nextStatus = namespace.status.resolveManualStatus(
          currentStatus,
          targetStatus,
        );
        controller.records[identity.key] = await storage.setCompanyStatus(
          identity.year,
          identity.companyId,
          nextStatus,
          { name: identity.name },
        );
        await controller.render();
      },
      async render() {
        const cards = controller.cardViews.map(({ identity }) => identity);
        const summary = namespace.status.summarizeCards(
          cards,
          controller.records,
          controller.settings,
        );
        updateToolbar(
          controller.toolbar,
          summary,
          controller.settings,
          controller.activeFilter,
        );
        for (const { card, controls, identity } of controller.cardViews) {
          const currentStatus = controller.records[identity.key]?.status || "unseen";
          updateCard(
            card,
            controls,
            currentStatus,
            controller.settings,
            controller.activeFilter,
          );
        }
        return summary;
      },
      async handleStorageChange(changes, areaName) {
        if (areaName !== "local" || !changes || typeof changes !== "object") {
          return null;
        }

        let shouldRender = false;
        for (const [key, change] of Object.entries(changes)) {
          if (key === STORAGE_KEYS.settings) {
            controller.settings = normalizeStorageSettings(change?.newValue);
            shouldRender = true;
            continue;
          }

          const companyPrefix = `${STORAGE_KEYS.companyPrefix}${controller.year}:`;
          if (!controller.year || !key.startsWith(companyPrefix)) continue;

          const identityKey = key.slice(STORAGE_KEYS.companyPrefix.length);
          if (change?.newValue === undefined) {
            delete controller.records[identityKey];
          } else {
            controller.records[identityKey] = change.newValue;
          }
          shouldRender = true;
        }

        return shouldRender ? controller.render() : null;
      },
      async refreshFromStorage() {
        if (!controller.year) return null;
        const [records, settings] = await Promise.all([
          storage.getCompaniesForYear(controller.year),
          storage.getSettings(),
        ]);
        controller.records = records;
        controller.settings = settings;
        return controller.render();
      },
      installSyncListeners() {
        if (controller.syncListenersInstalled) return;
        controller.syncListenersInstalled = true;

        const storageChanges = root.chrome?.storage?.onChanged;
        if (storageChanges?.addListener) {
          controller.storageChangeListener = (changes, areaName) =>
            controller.handleStorageChange(changes, areaName).catch((error) => {
              reportError("Storage change sync failed", error);
            });
          storageChanges.addListener(controller.storageChangeListener);
        }

        const view = documentRef.defaultView || root.window;
        if (view?.addEventListener) {
          controller.pageshowListener = () =>
            controller.refreshFromStorage().catch((error) => {
              reportError("pageshow storage refresh failed", error);
            });
          view.addEventListener("pageshow", controller.pageshowListener);
        }
      },
      async process() {
        const context = namespace.search.inspectSearchPage(documentRef, pageUrl);
        if (!context || !container) return null;
        controller.year = context.year;
        controller.settings = await storage.getSettings();
        controller.records = await storage.getCompaniesForYear(context.year);
        controller.toolbar = ensureToolbar(
          container,
          documentRef,
          controller.settings,
          (key, value) => controller.handleSettingChange(key, value),
          (filter) => controller.handleFilterChange(filter),
        );
        controller.cardViews = [];
        for (const card of container.querySelectorAll(CARD_SELECTOR)) {
          const identity = namespace.company.parseCompanyCard(card, pageUrl);
          if (!identity) continue;
          const controls = ensureCardControls(
            documentRef,
            card,
            identity,
            (currentIdentity, targetStatus) =>
              controller.handleStatusClick(currentIdentity, targetStatus),
          );
          controller.cardViews.push({ card, controls, identity });
        }
        controller.installSyncListeners();
        return controller.render();
      },
    };
    return controller;
  }

  async function enhanceSearchPage(documentRef, pageUrl, options = {}) {
    const parsed = namespace.url.parseMynaviUrl(pageUrl);
    if (!parsed.supported || parsed.pageType !== "search-results") return null;
    const storage = options.storage || namespace.storage;
    if (!storage || !documentRef?.querySelector?.("#contentsleft")) return null;
    const controller = createController(
      documentRef,
      pageUrl,
      storage,
    );
    await controller.process();
    return controller;
  }

  const api = { enhanceSearchPage };
  namespace.searchUI = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
