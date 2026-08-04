import test from "node:test";
import assert from "node:assert/strict";

import { isValidWebsiteOrSocial, normalizeWebsiteOrSocial } from "./utils.js";

const validCases = [
  ["", ""],
  ["https://example.com", "https://example.com"],
  ["http://example.com", "http://example.com"],
  ["example.com", "https://example.com"],
  ["www.example.com", "https://www.example.com"],
  ["example.com/path", "https://example.com/path"],
  ["instagram.com/example", "https://instagram.com/example"],
  ["@username", "@username"],
  ["  thealanashow.com  ", "https://thealanashow.com"]
];

test("normalizes and accepts website addresses and social usernames", () => {
  for (const [input, expected] of validCases) {
    const normalized = normalizeWebsiteOrSocial(input);
    assert.equal(normalized, expected, input);
    assert.equal(isValidWebsiteOrSocial(normalized), true, input);
  }
});

test("rejects invalid plain text and supports a corrected repeated submission", () => {
  for (const input of ["hello", "not a link", "example", "   "]) {
    assert.equal(normalizeWebsiteOrSocial(input), input.trim());
    assert.equal(isValidWebsiteOrSocial(input), false, input);
  }

  assert.equal(isValidWebsiteOrSocial("not a link"), false);
  assert.equal(isValidWebsiteOrSocial(normalizeWebsiteOrSocial("example.com")), true);
});
