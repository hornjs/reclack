import test from "node:test";
import assert from "node:assert/strict";
import { SpinnerHandle } from "../../src/index.ts";

test("spinner updates until resolved and only completes once", () => {
  const updates: string[] = [];
  const effects: string[] = [];

  const spinner = new SpinnerHandle(
    (message) => updates.push(message),
    () => effects.push("stop"),
    (message) => effects.push(`info:${message}`),
    (message) => effects.push(`error:${message}`),
  );

  spinner.update("loading");
  spinner.done("done");
  spinner.update("ignored");
  spinner.fail("ignored");

  assert.deepEqual(updates, ["loading"]);
  assert.deepEqual(effects, ["stop", "info:done"]);
});

test("spinner.fail stops and writes an error message", () => {
  const effects: string[] = [];

  const spinner = new SpinnerHandle(
    () => {},
    () => effects.push("stop"),
    (message) => effects.push(`info:${message}`),
    (message) => effects.push(`error:${message}`),
  );

  spinner.fail("failed");

  assert.deepEqual(effects, ["stop", "error:failed"]);
});
