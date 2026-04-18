import isUnicodeSupported from "is-unicode-supported";
import { formatColorTags } from "./color.ts";
import { colorizeLogMessage, writeMultiline } from "./utils.ts";
import { createState, flushStepHeader, type State } from "./state.ts";
import type {
  CollectedIssue,
  Issue,
  Options,
  LogLevel,
  WriteStream,
} from "./types.ts";
import { SpinnerHandle } from "./spinner.ts";
import { OverwriteHandle } from "./overwrite.ts";

const unicode = isUnicodeSupported();
const unicodeOr = (value: string, fallback: string) => (unicode ? value : fallback);

export const S_ERROR = unicodeOr("■", "x");
export const S_WARN = unicodeOr("▲", "!");
export const S_INFO = unicodeOr("●", "•");

export const S_SPIN = unicode
  ? ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
  : ["-", "\\", "|", "/"];

export type MessageOptions = {
  colorable?: boolean;
  stripColorTags?: boolean;
};

export type WriteOptions = {
  message: string;
  stderr?: boolean;
  firstPrefix?: string;
  continuationPrefix?: string;
  stripColorTags?: boolean;
};

export class BaseLogger<T extends CollectedIssue> {
  protected readonly state: State<T>;

  constructor(options: Options = {}, state?: State<T>) {
    this.state = state ?? createState(options);
  }

  protected get indent(): string {
    return this.state.currentStep ? "  " : "";
  }

  format(message: string, stripColorTags = this.state.options.stripColorTags ?? false): string {
    return formatColorTags({
      colorizer: this.state.colorizer,
      message,
      stripColorTags,
      styleTagAliases: this.state.options.styleTagAliases ?? false,
    });
  }

  write(options: WriteOptions): void {
    const stream = options.stderr ? this.state.stderr : this.state.stdout;
    this.writeMessage(
      stream,
      options.message,
      options.firstPrefix ?? this.indent,
      options.continuationPrefix ?? this.indent,
      options.stripColorTags ?? this.state.options.stripColorTags ?? false,
    );
  }

  debug(message: string): void {
    if (!this.state.options.debug) return;
    this.writeMessage(this.state.stderr, `<dim>[debug] ${message}</dim>`, this.indent, this.indent);
  }

  info(message: string, options: MessageOptions = {}): void {
    this.writeLog("info", message, options);
  }

  warn(message: string, options: MessageOptions = {}): void {
    this.writeLog("warning", message, options);
  }

  error(message: string, options: MessageOptions = {}): void {
    this.writeLog("error", message, options);
  }

  log(message = ""): void {
    this.writeMessage(this.state.stdout, message, this.indent, this.indent);
  }

  overwrite(message = ""): OverwriteHandle {
    // Any direct output inside a step must flush the deferred header first.
    flushStepHeader(this.state);
    this.state.stepHadOutput = true;
    const overwrite = new OverwriteHandle({
      stream: this.state.stdout,
      colorizer: this.state.colorizer,
      firstPrefix: this.indent,
      continuationPrefix: this.indent,
      stripColorTags: this.state.options.stripColorTags ?? false,
      styleTagAliases: this.state.options.styleTagAliases ?? false,
    });
    if (message) {
      overwrite.update(message);
    }
    return overwrite;
  }

  spin(message: string): SpinnerHandle {
    const isTTY = this.state.stdout.isTTY;
    let currentMessage = message;
    let stop = () => {};
    let update = (nextMessage: string) => {
      currentMessage = nextMessage;
    };

    if (this.state.colorizer && isTTY) {
      // Reuse overwrite so spinner updates share the same multiline rendering path.
      const overwrite = this.overwrite();
      let frame = 0;
      const interval = setInterval(() => {
        overwrite.update(`<cyan>${S_SPIN[frame++ % S_SPIN.length]}</cyan> ${currentMessage}`);
      }, 80);
      stop = () => {
        clearInterval(interval);
        overwrite.clear();
      };
    }

    return new SpinnerHandle(
      update,
      stop,
      (nextMessage) => this.info(nextMessage),
      (nextMessage) => this.error(nextMessage),
    );
  }

  protected startStep(name: string): void {
    this.state.currentStep = name;
    this.state.stepHadOutput = false;
    this.state.pendingStepHeader = `<dim>[${name}]</dim>`;
  }

  protected finishStep(name: string, message = "<green>OK</green>"): void {
    if (!this.state.stepHadOutput) {
      // Keep empty steps visible so callers still get an explicit success marker.
      this.state.stdout.write(`${formatColorTags({
        colorizer: this.state.colorizer,
        message: `${this.state.pendingStepHeader ?? `[${name}]`} ${message}`,
        stripColorTags: this.state.options.stripColorTags ?? false,
        styleTagAliases: this.state.options.styleTagAliases ?? false,
      })}\n`);
    }
    this.state.currentStep = undefined;
    this.state.pendingStepHeader = undefined;
    this.state.stepHadOutput = false;
  }

  protected pushIssue(issue: T): void {
    const storedIssue = { ...issue };
    this.state.issues.push(storedIssue);
  }

  issue(issue: Issue): void {
    // Logger stores `Issue | IssueGroup`, while step handles store `Issue`.
    // `Issue` is valid in both cases, so this shared path only needs a narrow cast.
    this.pushIssue(issue as T);
    this.writeIssueOutput(issue);
  }

  protected writeIssueOutput(issue: Issue): void {
    const continuation = `${this.indent}  `;
    switch (issue.type) {
      case "error":
        this.writeMessage(this.state.stderr, issue.message, `${this.indent}<red>${S_ERROR}</red> `, continuation);
        break;
      case "warning":
        this.writeMessage(this.state.stdout, issue.message, `${this.indent}<yellow>${S_WARN}</yellow> `, continuation);
        break;
      case "info":
        this.writeMessage(this.state.stdout, issue.message, `${this.indent}<green>${S_INFO}</green> `, continuation);
        break;
    }
  }

  private writeLog(level: LogLevel, message: string, options: MessageOptions): void {
    const stream = level === "error" ? this.state.stderr : this.state.stdout;
    const stripColorTags = options.stripColorTags ?? this.state.options.stripColorTags ?? false;
    const formattedMessage = options.colorable === false ? message : colorizeLogMessage(level, message);
    this.writeMessage(stream, formattedMessage, this.indent, this.indent, stripColorTags);
  }

  private writeMessage(
    stream: WriteStream | undefined,
    message: string,
    firstPrefix: string,
    continuationPrefix: string,
    stripColorTags = this.state.options.stripColorTags ?? false,
  ): void {
    flushStepHeader(this.state);
    this.state.stepHadOutput = true;
    writeMultiline(
      stream,
      message,
      firstPrefix,
      continuationPrefix,
      this.state.colorizer,
      stripColorTags,
      this.state.options.styleTagAliases ?? false,
    );
  }
}
