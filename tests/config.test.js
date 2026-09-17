const test = require("node:test");
const assert = require("node:assert/strict");

test("configuration centralizes supported years and defaults", () => {
  const config = require("../src/config.js");

  assert.deepEqual(config.SUPPORTED_YEARS, ["27", "28"]);
  assert.equal(config.STORAGE_KEY, "mynaviFilter");
  assert.deepEqual(config.DEFAULT_SETTINGS, {
    hideViewed: false,
    hidePass: true,
  });
  assert.equal(config.SCHEMA_VERSION, 1);
  assert.equal(config.DEBUG, false);
});
