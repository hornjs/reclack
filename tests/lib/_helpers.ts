import type { Colorizer, WriteStream } from "../../src/index.ts";

export function createBufferStream(isTTY = false): WriteStream & { output: string } {
  let output = "";

  return {
    isTTY,
    get output() {
      return output;
    },
    write(chunk: string | Uint8Array) {
      output += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    },
  };
}

export function createStubColorizer(): Colorizer {
  const supported = new Set([
    "red",
    "green",
    "yellow",
    "blue",
    "cyan",
    "magenta",
    "bold",
    "dim",
    "italic",
    "underline",
    "strikethrough",
  ]);

  return {
    wrap(name, input) {
      return `[${name}:${input?.toString() ?? ""}]`;
    },
    is(name) {
      return supported.has(name);
    },
  };
}
