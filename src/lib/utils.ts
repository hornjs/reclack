import { formatColorTags, type Colorizer } from "./color.ts";
import type {
  CollectedIssue,
  Issue,
  LogLevel,
  WriteStream,
} from "./types.ts";

export function colorizeLogMessage(level: LogLevel, message: string): string {
  switch (level) {
    case "info":
      return `<green>${message}</green>`;
    case "warning":
      return `<yellow>${message}</yellow>`;
    case "error":
      return `<red>${message}</red>`;
  }
}

export function issueHasType(issue: CollectedIssue, type: Issue["type"]): boolean {
  if ("type" in issue) {
    return issue.type === type;
  }
  // Step groups bubble their child issues up to Issuer.hasErrors/hasWarnings.
  return issue.issues.some((entry) => entry.type === type);
}

export function writeMultiline(
  stream: WriteStream | undefined,
  message: string,
  firstPrefix: string,
  continuationPrefix: string,
  colorizer: Colorizer | undefined,
  stripColorTags: boolean,
  styleTagAliases = false,
): void {
  stream?.write(`${renderMultiline(
    message,
    firstPrefix,
    continuationPrefix,
    colorizer,
    stripColorTags,
    styleTagAliases,
  )}\n`);
}

export function renderMultiline(
  message: string,
  firstPrefix: string,
  continuationPrefix: string,
  colorizer: Colorizer | undefined,
  stripColorTags: boolean,
  styleTagAliases = false,
): string {
  return formatColorTags({ colorizer, message, stripColorTags, styleTagAliases })
    .split("\n")
    .map((line, index) => {
      // Prefixes may carry markup too, for example colored issue symbols.
      const prefix = formatColorTags({
        colorizer,
        message: index === 0 ? firstPrefix : continuationPrefix,
        stripColorTags,
        styleTagAliases,
      });
      return `${prefix}${line}`;
    })
    .join("\n");
}
