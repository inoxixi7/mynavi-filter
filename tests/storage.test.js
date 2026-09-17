const test = require("node:test");
const assert = require("node:assert/strict");

let stored = {};
global.chrome = {
  storage: {
    local: {
      async get(keys) {
        if (keys === null || keys === undefined) return structuredClone(stored);
        const requested = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(
          requested
            .filter((key) => Object.prototype.hasOwnProperty.call(stored, key))
            .map((key) => [key, structuredClone(stored[key])]),
        );
      },
      async set(values) {
        stored = { ...stored, ...structuredClone(values) };
      },
    },
  },
};

require("../src/config.js");
require("../src/utils/mynavi-url.js");
require("../src/utils/company-id.js");
const storage = require("../src/storage/storage.js");

test.beforeEach(() => {
  stored = {};
});

test("returns default settings without writing state", async () => {
  assert.deepEqual(await storage.getSettings(), {
    hideViewed: false,
    hidePass: true,
  });
  assert.deepEqual(stored, {});
});

test("normalizes malformed or unknown stored settings", async () => {
  stored["mynaviFilter:schemaVersion"] = 0;
  stored["mynaviFilter:settings"] = {
    hideViewed: "yes",
    hidePass: false,
    unknown: true,
  };

  assert.deepEqual(await storage.getSettings(), {
    hideViewed: false,
    hidePass: false,
  });
});

test("stores the same company independently by year", async () => {
  await storage.setCompanyStatus("27", "66450", "viewed", {
    name: "Example Corp",
  });
  await storage.setCompanyStatus("28", "66450", "pass", {
    name: "Example Corp",
  });

  assert.equal((await storage.getCompany("27", "66450")).status, "viewed");
  assert.equal((await storage.getCompany("28", "66450")).status, "pass");
  assert.deepEqual(Object.keys(await storage.getCompaniesForYear("27")), [
    "27:66450",
  ]);
  assert.equal(stored["mynaviFilter:schemaVersion"], 1);
});

test("writes createdAt and updatedAt without inventing a viewed timestamp", async () => {
  const initial = await storage.setCompanyStatus("27", "66450", "candidate", {
    name: "Example Corp",
  });
  const updated = await storage.setCompanyStatus("27", "66450", "pass");

  assert.match(initial.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(initial.updatedAt, initial.createdAt);
  assert.equal(initial.lastViewedAt, undefined);
  assert.equal(updated.createdAt, initial.createdAt);
  assert.equal(updated.name, "Example Corp");
  assert.equal(updated.status, "pass");
  assert.match(updated.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(updated.lastViewedAt, undefined);
});

test("updates lastViewedAt only when a company detail page is marked viewed", async () => {
  const initial = await storage.setCompanyStatus("27", "100", "candidate", {
    name: "New Corp",
  });
  const updated = await storage.setCompanyStatus("27", "100", "candidate");
  assert.equal(updated.lastViewedAt, undefined);

  const viewed = await storage.markCompanyViewed("27", "100", {
    name: "New Corp Updated",
  });
  assert.equal(viewed.status, "candidate");
  assert.equal(viewed.name, "New Corp Updated");
  assert.match(viewed.lastViewedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(viewed.createdAt, initial.createdAt);
  assert.equal(viewed.updatedAt, viewed.lastViewedAt);

  const statusUpdated = await storage.setCompanyStatus("27", "100", "candidate");
  assert.equal(statusUpdated.lastViewedAt, viewed.lastViewedAt);
});

test("marks unseen companies viewed without overwriting candidate or pass", async () => {
  const first = await storage.markCompanyViewed("27", "101", {
    name: "New Corp",
  });
  assert.equal(first.status, "viewed");

  await storage.setCompanyStatus("27", "102", "candidate", {
    name: "Candidate Corp",
  });
  const candidate = await storage.markCompanyViewed("27", "102", {
    name: "Candidate Corp Updated",
  });
  assert.equal(candidate.status, "candidate");
  assert.equal(candidate.name, "Candidate Corp Updated");
  assert.match(candidate.lastViewedAt, /^\d{4}-\d{2}-\d{2}T/);

  await storage.setCompanyStatus("27", "103", "pass", {
    name: "Passed Corp",
  });
  const passed = await storage.markCompanyViewed("27", "103");
  assert.equal(passed.status, "pass");
  assert.match(passed.lastViewedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("concurrent updates for different companies do not overwrite each other", async () => {
  const [candidate, passed] = await Promise.all([
    storage.setCompanyStatus("27", "201", "candidate", { name: "Candidate Corp" }),
    storage.setCompanyStatus("27", "202", "pass", { name: "Passed Corp" }),
  ]);

  assert.equal(candidate.status, "candidate");
  assert.equal(passed.status, "pass");
  assert.equal((await storage.getCompany("27", "201")).name, "Candidate Corp");
  assert.equal((await storage.getCompany("27", "202")).name, "Passed Corp");
  assert.deepEqual(Object.keys(await storage.getCompaniesForYear("27")).sort(), [
    "27:201",
    "27:202",
  ]);
});

test("rejects unsupported years, malformed IDs, and unseen writes", async () => {
  await assert.rejects(
    storage.setCompanyStatus("29", "66450", "viewed"),
    /year/,
  );
  await assert.rejects(
    storage.setCompanyStatus("27", "corp66450", "viewed"),
    /companyId/,
  );
  await assert.rejects(
    storage.setCompanyStatus("27", "66450", "unseen"),
    /status/,
  );
});

test("updates only recognized boolean settings", async () => {
  assert.deepEqual(
    await storage.setSettings({ hideViewed: true, unknown: true }),
    {
      hideViewed: true,
      hidePass: true,
    },
  );
  assert.deepEqual(await storage.setSettings({ hidePass: false }), {
    hideViewed: true,
    hidePass: false,
  });
  assert.deepEqual(stored["mynaviFilter:settings"], {
    hideViewed: true,
    hidePass: false,
  });
  assert.equal(stored.mynaviFilter, undefined);
});
