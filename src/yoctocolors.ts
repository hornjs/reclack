import * as yoctocolors from "yoctocolors";
import type { Format } from "yoctocolors";
import type { Colorizer } from "./lib/color.ts";

export function createYocto(enabled: boolean): Colorizer {
  const cached = new Map<string, Format>();

  for (const [key, value] of Object.entries(yoctocolors)) {
    if (typeof value === "function") {
      cached.set(key, value as Format);
    }
  }

  return {
    wrap: (name, input) => {
      if (input == null || input === "") return "";
      const message = input.toString();
      if (!enabled) return message;
      return cached.get(name)?.(message) ?? message;
    },
    is: (name) => cached.has(name),
  };
}
