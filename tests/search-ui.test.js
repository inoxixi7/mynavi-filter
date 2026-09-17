const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/config.js");
require("../src/utils/mynavi-url.js");
require("../src/utils/company-id.js");
require("../src/content/status.js");
require("../src/content/search.js");
const searchUI = require("../src/content/search-ui.js");

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  toggle(name, force) {
    const next = force === undefined ? !this.values.has(name) : force;
    if (next) this.values.add(name);
    else this.values.delete(name);
    return next;
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.dataset = {};
    this.style = {};
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.textContent = "";
    this.checked = false;
    this.type = "";
    this.value = "";
  }

  append(...nodes) {
    nodes.forEach((node) => {
      node.parentNode = this;
      this.children.push(node);
    });
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  prepend(node) {
    node.parentNode = this;
    this.children.unshift(node);
  }

  insertBefore(node, reference) {
    node.parentNode = this;
    const index = this.children.indexOf(reference);
    if (index === -1) this.children.push(node);
    else this.children.splice(index, 0, node);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "class") value.split(/\s+/).forEach((item) => item && this.classList.add(item));
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  addEventListener(type, listener) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(listener);
    this.listeners.set(type, handlers);
  }

  async dispatchEvent(event) {
    event.target = event.target || this;
    const handlers = this.listeners.get(event.type) || [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  async click() {
    await this.dispatchEvent({ type: "click", target: this, preventDefault() {}, stopPropagation() {} });
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (node) => {
      if (matchesSelector(node, selector)) matches.push(node);
      node.children.forEach(visit);
    };
    this.children.forEach(visit);
    return matches;
  }
}

class FakeDocument extends FakeElement {
  constructor(container) {
    super("document");
    this.container = container;
    this.children = [container];
    container.parentNode = this;
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  querySelector(selector) {
    if (selector === "#contentsleft") return this.container;
    return super.querySelector(selector);
  }
}

class FakeCard extends FakeElement {
  constructor({ href, name }) {
    super("div");
    this.classList.add("boxSearchresultEach", "corp");
    this.link = new FakeElement("a");
    this.link.childNodes = [{ textContent: name }];
    this.link.textContent = name;
    this.link.getAttribute = (attribute) =>
      attribute === "href" ? href : FakeElement.prototype.getAttribute.call(this.link, attribute);
    const head = new FakeElement("div");
    head.classList.add("boxSearchresultEach_head");
    this.heading = new FakeElement("h3");
    this.heading.classList.add("withCheck");
    this.heading.append(this.link);
    head.append(this.heading);
    this.append(head);
  }

  querySelector(selector) {
    if (selector === ".boxSearchresultEach_head h3") return this.heading;
    if (selector === ".boxSearchresultEach_head h3 a") return this.link;
    return super.querySelector(selector);
  }
}

function matchesSelector(node, selector) {
  if (selector === "b") return node.tagName === "B";
  if (selector === ".boxSearchresultEach.corp") {
    return node.classList.contains("boxSearchresultEach") && node.classList.contains("corp");
  }
  if (selector === '[data-mynavi-filter="toolbar"]') {
    return node.dataset.mynaviFilter === "toolbar";
  }
  if (selector === '[data-mynavi-filter="controls"]') {
    return node.dataset.mynaviFilter === "controls";
  }
  if (selector === "button[data-status]") {
    return node.tagName === "BUTTON" && node.dataset.status;
  }
  const buttonStatus = selector.match(/^button\[data-status="([^"]+)"\]$/);
  if (buttonStatus) {
    return node.tagName === "BUTTON" && node.dataset.status === buttonStatus[1];
  }
  const stat = selector.match(/^\[data-stat="([^"]+)"\]$/);
  if (stat) return node.dataset.stat === stat[1];
  const setting = selector.match(/^input\[data-setting="([^"]+)"\]$/);
  if (setting) return node.tagName === "INPUT" && node.dataset.setting === setting[1];
  return false;
}

function makeSearchDocument(cards) {
  const container = new FakeElement("main");
  container.setAttribute("id", "contentsleft");
  cards.forEach((card) => container.append(card));
  return new FakeDocument(container);
}

function createStorage({ companies = {}, settings = { hideViewed: false, hidePass: true } } = {}) {
  let currentCompanies = structuredClone(companies);
  let currentSettings = { ...settings };
  return {
    async getCompaniesForYear(year) {
      return Object.fromEntries(
        Object.entries(currentCompanies).filter(([, company]) => company.year === year),
      );
    },
    async getSettings() {
      return { ...currentSettings };
    },
    async setSettings(patch) {
      currentSettings = { ...currentSettings, ...patch };
      return { ...currentSettings };
    },
    async setCompanyStatus(year, companyId, nextStatus, metadata = {}) {
      const key = `${year}:${companyId}`;
      const existing = currentCompanies[key];
      currentCompanies[key] = {
        year,
        companyId,
        name: metadata.name || existing?.name || "",
        status: nextStatus,
      };
      return currentCompanies[key];
    },
    snapshot() {
      return { companies: structuredClone(currentCompanies), settings: { ...currentSettings } };
    },
  };
}

const resultUrl = "https://job.mynavi.jp/27/pc/search/inc63.html";

test("injects an idempotent toolbar and status controls with current-page counts", async () => {
  const unseenCard = new FakeCard({ href: "/27/pc/search/corp1/outline.html", name: "Unseen Corp" });
  const candidateCard = new FakeCard({ href: "/27/pc/search/corp2/outline.html", name: "Candidate Corp" });
  const passCard = new FakeCard({ href: "/27/pc/search/corp3/outline.html", name: "Pass Corp" });
  const documentRef = makeSearchDocument([unseenCard, candidateCard, passCard]);
  const storage = createStorage({
    companies: {
      "27:2": { year: "27", companyId: "2", name: "Candidate Corp", status: "candidate" },
      "27:3": { year: "27", companyId: "3", name: "Pass Corp", status: "pass" },
    },
  });

  const controller = await searchUI.enhanceSearchPage(documentRef, resultUrl, {
    storage,
    observe: false,
  });

  assert.equal(documentRef.querySelectorAll('[data-mynavi-filter="toolbar"]').length, 1);
  assert.equal(unseenCard.querySelectorAll("button[data-status]").length, 3);
  assert.equal(candidateCard.querySelectorAll("button[data-status]").length, 3);
  assert.equal(passCard.querySelectorAll("button[data-status]").length, 3);
  assert.equal(documentRef.querySelector('[data-stat="unseen"]').querySelector("b").textContent, "1");
  assert.equal(documentRef.querySelector('[data-stat="candidate"]').querySelector("b").textContent, "1");
  assert.equal(documentRef.querySelector('[data-stat="viewed"]').querySelector("b").textContent, "0");
  assert.equal(documentRef.querySelector('[data-stat="pass"]').querySelector("b").textContent, "1");
  assert.equal(passCard.classList.contains("mynavi-filter-hidden"), true);
  assert.equal(passCard.querySelector('[data-mynavi-filter="controls"]').parentNode, passCard.heading);
  assert.equal(passCard.querySelector('button[data-status="viewed"]').textContent, "✓");
  assert.equal(passCard.querySelector('button[data-status="candidate"]').textContent, "☆");
  assert.equal(passCard.querySelector('button[data-status="pass"]').textContent, "×");
  assert.equal(passCard.querySelector('button[data-status="pass"]').getAttribute("aria-label"), "見送り");
  assert.equal(passCard.querySelector('button[data-status="pass"]').getAttribute("title"), "見送り");

  await controller.process();
  assert.equal(documentRef.querySelectorAll('[data-mynavi-filter="toolbar"]').length, 1);
  assert.equal(unseenCard.querySelectorAll("button[data-status]").length, 3);
});

test("updates storage, selected state, counts, and visibility without reload", async () => {
  const card = new FakeCard({ href: "/27/pc/search/corp1/outline.html", name: "Example Corp" });
  const documentRef = makeSearchDocument([card]);
  const storage = createStorage();
  await searchUI.enhanceSearchPage(documentRef, resultUrl, { storage, observe: false });

  await card.querySelector('button[data-status="pass"]').click();
  assert.equal(storage.snapshot().companies["27:1"].status, "pass");
  assert.equal(card.classList.contains("mynavi-filter-hidden"), true);
  assert.equal(documentRef.querySelector('[data-stat="pass"]').querySelector("b").textContent, "1");

  await documentRef.querySelector('input[data-setting="hidePass"]').dispatchEvent({
    type: "change",
    target: { checked: false },
  });
  assert.equal(card.classList.contains("mynavi-filter-hidden"), false);

  await card.querySelector('button[data-status="pass"]').click();
  assert.equal(storage.snapshot().companies["27:1"].status, "viewed");
  assert.equal(documentRef.querySelector('[data-stat="viewed"]').querySelector("b").textContent, "1");
});
