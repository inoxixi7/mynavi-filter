const test = require("node:test");
const assert = require("node:assert/strict");

test("configuration centralizes supported years and defaults", () => {
  const config = require("../src/config.js");

  assert.deepEqual(config.SUPPORTED_YEARS, ["27", "28"]);
  assert.deepEqual(config.STORAGE_KEYS, {
    schemaVersion: "mynaviFilter:schemaVersion",
    settings: "mynaviFilter:settings",
    companyPrefix: "mynaviFilter:company:",
  });
  assert.deepEqual(config.DEFAULT_SETTINGS, {
    hideViewed: false,
    hidePass: true,
  });
  assert.equal(config.SCHEMA_VERSION, 1);
  assert.equal(config.DEBUG, false);
});
