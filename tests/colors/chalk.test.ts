import test from "node:test";
import assert from "node:assert/strict";
import { createChalk } from "../../src/chalk.ts";

test("createChalk exposes supported styles and respects the enabled flag", () => {
  const enabled = createChalk(true);
  const disabled = createChalk(false);

  assert.equal(enabled.is("red"), true);
  assert.equal(enabled.is("missing"), false);
  assert.notEqual(enabled.wrap("red", "hello"), "hello");
  assert.equal(disabled.wrap("red", "hello"), "hello");
});
