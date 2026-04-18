import test from "node:test";
import assert from "node:assert/strict";
import { createPico } from "../../src/picocolors.ts";

test("createPico exposes supported styles and respects the enabled flag", () => {
  const enabled = createPico(true);
  const disabled = createPico(false);

  assert.equal(enabled.is("red"), true);
  assert.equal(enabled.is("missing"), false);
  assert.notEqual(enabled.wrap("red", "hello"), "hello");
  assert.equal(disabled.wrap("red", "hello"), "hello");
});
