import test from "node:test";
import assert from "node:assert/strict";
import { createAnsiStyles } from "../../src/ansi-styles.ts";

test("createAnsiStyles exposes supported styles and respects the enabled flag", () => {
  const enabled = createAnsiStyles(true);
  const disabled = createAnsiStyles(false);

  assert.equal(enabled.is("red"), true);
  assert.equal(enabled.is("missing"), false);
  assert.notEqual(enabled.wrap("red", "hello"), "hello");
  assert.equal(disabled.wrap("red", "hello"), "hello");
});
