import test from "node:test";
import assert from "node:assert/strict";
import { formatColorTags, stripColorTags } from "../../src/lib/color.ts";
import { createStubColorizer } from "./_helpers.ts";

test("formatColorTags keeps unsupported tags when stripping is disabled", () => {
  const colorizer = createStubColorizer();

  assert.equal(
    formatColorTags({
      colorizer,
      message: "<unknown>Hello</unknown>",
      stripColorTags: false,
    }),
    "<unknown>Hello</unknown>",
  );
});

test("formatColorTags strips unsupported tags when stripping is enabled", () => {
  const colorizer = createStubColorizer();

  assert.equal(
    formatColorTags({
      colorizer,
      message: "<unknown>Hello</unknown>",
      stripColorTags: true,
    }),
    "Hello",
  );
});

test("formatColorTags supports style tag aliases when enabled", () => {
  const colorizer = createStubColorizer();

  assert.equal(
    formatColorTags({
      colorizer,
      message: "<u>Link</u>",
      stripColorTags: false,
      styleTagAliases: true,
    }),
    "[underline:Link]",
  );
});

test("formatColorTags ignores style tag aliases when disabled", () => {
  const colorizer = createStubColorizer();

  assert.equal(
    formatColorTags({
      colorizer,
      message: "<u>Link</u>",
      stripColorTags: false,
      styleTagAliases: false,
    }),
    "<u>Link</u>",
  );
});

test("formatColorTags applies multiple color tokens from the color attribute", () => {
  const colorizer = createStubColorizer();

  assert.equal(
    formatColorTags({
      colorizer,
      message: '<span color="cyan bold" underline>Link</span>',
      stripColorTags: false,
      styleTagAliases: true,
    }),
    "[underline:[bold:[cyan:Link]]]",
  );
});

test("stripColorTags removes supported markup when requested", () => {
  assert.equal(stripColorTags("<red>Hello</red>", true), "Hello");
});
