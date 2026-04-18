import test from "node:test";
import assert from "node:assert/strict";
import { Logger } from "../../src/index.ts";
import { createBufferStream, createStubColorizer } from "./_helpers.ts";

test("empty steps render a single OK line", () => {
  const stdout = createBufferStream();
  const stderr = createBufferStream();
  const logger = new Logger({
    stdout,
    stderr,
    colorizer: createStubColorizer(),
  });

  logger.step("build").done();

  assert.equal(stdout.output, "[dim:[build]] [green:OK]\n");
  assert.equal(stderr.output, "");
});

test("empty steps can customize the completion message", () => {
  const stdout = createBufferStream();
  const stderr = createBufferStream();
  const logger = new Logger({
    stdout,
    stderr,
    colorizer: createStubColorizer(),
  });

  logger.step("build").done("<yellow>SKIPPED</yellow>");

  assert.equal(stdout.output, "[dim:[build]] [yellow:SKIPPED]\n");
  assert.equal(stderr.output, "");
});

test("step issues flush the step header and are grouped on the parent issuer", () => {
  const stdout = createBufferStream();
  const stderr = createBufferStream();
  const logger = new Logger({
    stdout,
    stderr,
    colorizer: createStubColorizer(),
  });

  const step = logger.step("doctor");
  step.issue({ type: "warning", message: "needs attention" });
  step.done();

  assert.equal(stdout.output, "[dim:[doctor]]\n  [yellow:▲] needs attention\n");
  assert.equal(stderr.output, "");
  assert.deepEqual(logger.issuer.issues, [
    {
      step: "doctor",
      issues: [
        { type: "warning", message: "needs attention" },
      ],
    },
  ]);
  assert.equal(logger.issuer.hasWarnings, true);
  assert.equal(logger.issuer.hasErrors, false);
});

test("logger.error writes to stderr and tracks errors", () => {
  const stdout = createBufferStream();
  const stderr = createBufferStream();
  const logger = new Logger({
    stdout,
    stderr,
    colorizer: createStubColorizer(),
  });

  logger.issue({ type: "error", message: "broken" });

  assert.equal(stdout.output, "");
  assert.equal(stderr.output, "[red:■] broken\n");
  assert.equal(logger.issuer.hasErrors, true);
});

test("write respects stripColorTags and stderr routing", () => {
  const stdout = createBufferStream();
  const stderr = createBufferStream();
  const logger = new Logger({
    stdout,
    stderr,
    colorizer: createStubColorizer(),
  });

  logger.write({
    message: "<unknown>Hello</unknown>",
    stderr: true,
    stripColorTags: true,
  });

  assert.equal(stdout.output, "");
  assert.equal(stderr.output, "Hello\n");
});
