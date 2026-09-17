const test = require("node:test");
const assert = require("node:assert/strict");

let stored = {};
global.chrome = {
  storage: {
    local: {
      async get(key) {
        return Object.prototype.hasOwnProperty.call(stored, key)
          ? { [key]: structuredClone(stored[key]) }
          : {};
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
});

test("preserves firstSeenAt and existing metadata across status changes", async () => {
  const initial = await storage.setCompanyStatus("27", "66450", "viewed", {
    name: "Example Corp",
  });
  const updated = await storage.setCompanyStatus("27", "66450", "candidate");

  assert.equal(updated.firstSeenAt, initial.firstSeenAt);
  assert.equal(updated.name, "Example Corp");
  assert.equal(updated.status, "candidate");
  assert.match(updated.lastSeenAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(updated.lastSeenAt, updated.updatedAt);
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
});
