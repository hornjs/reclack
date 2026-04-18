import ansiColors, { type StyleFunction } from "ansi-colors";
import type { Colorizer } from "./lib/color.ts";

// ansi-colors also exposes helper functions like `alias` and `theme`.
// Keep an explicit style whitelist so only renderable styles become tags.
const STYLE_NAMES: (keyof ReturnType<typeof ansiColors.create>)[] = [
  "reset",
  "bold",
  "dim",
  "italic",
  "underline",
  "inverse",
  "hidden",
  "strikethrough",
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "gray",
  "grey",
  "blackBright",
  "redBright",
  "greenBright",
  "yellowBright",
  "blueBright",
  "magentaBright",
  "cyanBright",
  "whiteBright",
  "bgBlack",
  "bgRed",
  "bgGreen",
  "bgYellow",
  "bgBlue",
  "bgMagenta",
  "bgCyan",
  "bgWhite",
  "bgBlackBright",
  "bgRedBright",
  "bgGreenBright",
  "bgYellowBright",
  "bgBlueBright",
  "bgMagentaBright",
  "bgCyanBright",
  "bgWhiteBright",
] as const;

export function createAnsiColors(enabled: boolean): Colorizer {
  const colors = ansiColors.create();
  colors.enabled = enabled;

  const cached = new Map<string, StyleFunction>();
  for (const key of STYLE_NAMES) {
    const value = colors[key];
    if (typeof value === "function") {
      cached.set(key, value as StyleFunction);
    }
  }

  return {
    wrap: (name, input) => {
      if (input == null || input === "") return "";
      const text = input.toString();
      return cached.get(name)?.(text) ?? text;
    },
    is: (name) => cached.has(name),
  };
}
