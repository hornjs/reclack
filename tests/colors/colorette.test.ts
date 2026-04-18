import test from "node:test";
import assert from "node:assert/strict";
import { createColorette } from "../../src/colorette.ts";

test("createColorette exposes supported styles and respects the enabled flag", () => {
  const enabled = createColorette(true);
  const disabled = createColorette(false);

  assert.equal(enabled.is("red"), true);
  assert.equal(enabled.is("missing"), false);
  assert.notEqual(enabled.wrap("red", "hello"), "hello");
  assert.equal(disabled.wrap("red", "hello"), "hello");
});
