(function initializeSearchUi(root) {
  const namespace = (root.MynaviFilter = root.MynaviFilter || {});
  const CARD_SELECTOR = ".boxSearchresultEach.corp";
  const LABELS = Object.freeze({
    viewed: "閲覧済み",
    candidate: "候補",
    pass: "見送り",
  });
  const ICONS = Object.freeze({
    viewed: "✓",
    candidate: "☆",
    pass: "×",
  });
  const STAT_LABELS = Object.freeze({
    unseen: "未確認",
    candidate: "候補",
    viewed: "閲覧済み",
    pass: "見送り",
    hidden: "非表示",
  });
  const SETTING_LABELS = Object.freeze({
    hideViewed: "閲覧済みを隠す",
    hidePass: "見送り企業を隠す",
  });

  function reportError(message, error) {
    if (namespace.config?.DEBUG) {
      console.debug(`[Mynavi Filter] ${message}`, error);
    }
  }

  function append(parent, ...children) {
    if (typeof parent.append === "function") parent.append(...children);
    else children.forEach((child) => parent.appendChild(child));
  }

  function createToolbar(documentRef, settings, onSettingChange) {
    const toolbar = documentRef.createElement("section");
    toolbar.setAttribute("data-mynavi-filter", "toolbar");
    toolbar.classList.add("mynavi-filter-toolbar");

    const panelId = "mynavi-filter-panel";
    const toggle = documentRef.createElement("button");
    toggle.type = "button";
    toggle.classList.add("mynavi-filter-toggle");
    toggle.textContent = "≡";
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
    append(toolbar, summary);

    const settingsRow = documentRef.createElement("div");
    settingsRow.classList.add("mynavi-filter-settings");
    for (const [key, labelText] of Object.entries(SETTING_LABELS)) {
      const label = documentRef.createElement("label");
      label.classList.add("mynavi-filter-setting");
      const input = documentRef.createElement("input");
      input.type = "checkbox";
      input.checked = settings[key] === true;
      input.setAttribute("data-setting", key);
      input.addEventListener("change", (event) =>
        Promise.resolve(onSettingChange(key, Boolean(event.target.checked))).catch(
          (error) => reportError("Setting update failed", error),
        ),
      );
      const text = documentRef.createElement("span");
      text.textContent = labelText;
      append(label, input, text);
      append(settingsRow, label);
    }
    const panelHeader = documentRef.createElement("div");
    panelHeader.classList.add("mynavi-filter-panel-header");
    append(panelHeader, title, summary);
    append(panel, panelHeader, settingsRow);

    let hoverOpen = false;
    let pinnedOpen = false;
    const setOpen = (open) => {
      toolbar.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", `Mynavi Filterを${open ? "閉じる" : "開く"}`);
    };
    const syncOpen = () => setOpen(hoverOpen || pinnedOpen);
    toggle.addEventListener("click", () => {
      pinnedOpen = !pinnedOpen;
      syncOpen();
    });
    toolbar.addEventListener("mouseenter", () => {
      hoverOpen = true;
      syncOpen();
    });
    toolbar.addEventListener("mouseleave", () => {
      hoverOpen = false;
      syncOpen();
    });
    toolbar.addEventListener("focusin", () => {
      hoverOpen = true;
      syncOpen();
    });
    toolbar.addEventListener("focusout", (event) => {
      if (!toolbar.contains?.(event.relatedTarget)) {
        hoverOpen = false;
        syncOpen();
      }
    });

    append(toolbar, toggle, panel);
    return toolbar;
  }

  function updateToolbar(toolbar, summary, settings) {
    for (const key of ["unseen", "candidate", "viewed", "pass", "hidden"]) {
      const item = toolbar.querySelector(`[data-stat="${key}"]`);
      const value = item?.querySelector?.("b");
      if (value) value.textContent = String(summary[key]);
    }
    for (const key of Object.keys(SETTING_LABELS)) {
      const input = toolbar.querySelector(`input[data-setting="${key}"]`);
      if (input) input.checked = settings[key] === true;
    }
  }

  function ensureToolbar(container, documentRef, settings, onSettingChange) {
    const host = documentRef.body || documentRef.querySelector?.("body") || container;
    const existing =
      host.querySelector?.('[data-mynavi-filter="toolbar"]') ||
      container.querySelector('[data-mynavi-filter="toolbar"]');
    if (existing) return existing;
    const toolbar = createToolbar(documentRef, settings, onSettingChange);
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

  function updateCard(card, controls, status, settings) {
    if (!controls) return;
    for (const button of controls.querySelectorAll("button[data-status]")) {
      const selected = button.dataset.status === status;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    card.classList.toggle(
      "mynavi-filter-hidden",
      namespace.status.shouldHide(status, settings),
    );
    card.setAttribute("data-mynavi-filter-status", status);
  }

  function createController(documentRef, pageUrl, storage, observe) {
    const container = documentRef.querySelector("#contentsleft");
    const controller = {
      documentRef,
      pageUrl,
      storage,
      container,
      settings: null,
      records: {},
      toolbar: null,
      observer: null,
      timer: null,
      cardViews: [],
      async handleSettingChange(key, value) {
        controller.settings = await storage.setSettings({ [key]: value });
        await controller.process();
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
        updateToolbar(controller.toolbar, summary, controller.settings);
        for (const { card, controls, identity } of controller.cardViews) {
          const currentStatus = controller.records[identity.key]?.status || "unseen";
          updateCard(card, controls, currentStatus, controller.settings);
        }
        return summary;
      },
      async process() {
        const context = namespace.search.inspectSearchPage(documentRef, pageUrl);
        if (!context || !container) return null;
        controller.settings = await storage.getSettings();
        controller.records = await storage.getCompaniesForYear(context.year);
        controller.toolbar = ensureToolbar(
          container,
          documentRef,
          controller.settings,
          (key, value) => controller.handleSettingChange(key, value),
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
        return controller.render();
      },
      destroy() {
        if (controller.timer) clearTimeout(controller.timer);
        controller.observer?.disconnect?.();
      },
    };

    if (observe && typeof root.MutationObserver === "function") {
      controller.observer = new root.MutationObserver(() => {
        clearTimeout(controller.timer);
        controller.timer = setTimeout(() => controller.process(), 50);
      });
      controller.observer.observe(container, { childList: true, subtree: true });
    }
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
      options.observe !== false,
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
