import ansiStyles, { type CSPair } from "ansi-styles";
import type { Colorizer } from "./lib/color.ts";

function isCSPair(value: unknown): value is CSPair {
  return typeof value === "object"
    && value !== null
    && "open" in value
    && "close" in value;
}

export function createAnsiStyles(enabled: boolean): Colorizer {
  const cached = new Map<string, CSPair>();

  for (const [key, value] of Object.entries(ansiStyles)) {
    if (isCSPair(value)) {
      cached.set(key, value);
    }
  }

  return {
    wrap: (name, input) => {
      if (input == null || input === "") return "";
      const message = input.toString();
      if (!enabled) return message;
      const style = cached.get(name);
      if (!style) return message;
      return `${style.open}${message}${style.close}`;
    },
    is: (name) => cached.has(name),
  };
}
