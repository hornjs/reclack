import test from "node:test";
import assert from "node:assert/strict";
import { createAnsiColors } from "../../src/ansi-colors.ts";

test("createAnsiColors exposes supported styles and respects the enabled flag", () => {
  const enabled = createAnsiColors(true);
  const disabled = createAnsiColors(false);

  assert.equal(enabled.is("red"), true);
  assert.equal(enabled.is("missing"), false);
  assert.notEqual(enabled.wrap("red", "hello"), "hello");
  assert.equal(disabled.wrap("red", "hello"), "hello");
});
