const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/config.js");
const status = require("../src/content/status.js");

test("summarizes only the current page and counts absent records as unseen", () => {
  const cards = [
    { key: "27:1" },
    { key: "27:2" },
    { key: "27:3" },
    { key: "27:4" },
    { key: "27:5" },
  ];
  const records = {
    "27:2": { status: "candidate" },
    "27:3": { status: "viewed" },
    "27:4": { status: "pass" },
    "28:99": { status: "pass" },
  };

  assert.deepEqual(
    status.summarizeCards(cards, records, { hideViewed: false, hidePass: true }),
    { unseen: 2, candidate: 1, viewed: 1, pass: 1, hidden: 1 },
  );
});

test("hides only viewed and pass statuses according to settings", () => {
  assert.equal(status.shouldHide("unseen", { hideViewed: true, hidePass: true }), false);
  assert.equal(status.shouldHide("candidate", { hideViewed: true, hidePass: true }), false);
  assert.equal(status.shouldHide("viewed", { hideViewed: false, hidePass: true }), false);
  assert.equal(status.shouldHide("viewed", { hideViewed: true, hidePass: true }), true);
  assert.equal(status.shouldHide("pass", { hideViewed: false, hidePass: true }), true);
  assert.equal(status.shouldHide("pass", { hideViewed: false, hidePass: false }), false);
});

test("clicking a selected manual status returns the company to viewed", () => {
  assert.equal(status.resolveManualStatus("unseen", "candidate"), "candidate");
  assert.equal(status.resolveManualStatus("viewed", "candidate"), "candidate");
  assert.equal(status.resolveManualStatus("candidate", "candidate"), "viewed");
  assert.equal(status.resolveManualStatus("pass", "pass"), "viewed");
  assert.equal(status.resolveManualStatus("viewed", "viewed"), "viewed");
});
