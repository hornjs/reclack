import test from "node:test";
import assert from "node:assert/strict";
import { createYocto } from "../../src/yoctocolors.ts";

test("createYocto exposes supported styles and respects the enabled flag", () => {
  const enabled = createYocto(true);
  const disabled = createYocto(false);

  assert.equal(enabled.is("red"), true);
  assert.equal(enabled.is("missing"), false);
  assert.equal(enabled.wrap("missing", "hello"), "hello");
  assert.equal(disabled.wrap("red", "hello"), "hello");
});
