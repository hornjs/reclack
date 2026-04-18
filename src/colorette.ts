import { createColors, type Color } from "colorette";
import type { Colorizer } from "./lib/color.ts";

export function createColorette(enabled: boolean): Colorizer {
  const colors = createColors({ useColor: enabled });
  const cached = new Map<string, Color>();

  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "function") {
      cached.set(key, value);
    }
  }

  return {
    wrap: (name, input) => {
      if (input == null || input === "") return "";
      return cached.get(name)?.(input) ?? input.toString();
    },
    is: (name) => cached.has(name),
  };
}
