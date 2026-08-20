import assert from "node:assert/strict";
import test from "node:test";

import { formatDate } from "./utils.js";

test("publication dates use the verified UTC calendar day near midnight", () => {
  const originalTimeZone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    assert.equal(formatDate("2026-08-20T00:30:00Z"), "Aug 20, 2026");
    assert.equal(formatDate("2026-08-19T23:30:00-01:00"), "Aug 20, 2026");
  } finally {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
  }
});

test("publication dates fail closed for empty or invalid values", () => {
  assert.equal(formatDate(""), "");
  assert.equal(formatDate("not-a-date"), "");
});
