import type {
  CollectedIssue,
  Options,
  WriteStream,
} from "./types.ts";
import { BaseLogger } from "./base.ts";
import { Issuer } from "./issuer.ts";
import { StepperHandle } from "./stepper.ts";
import type { Colorizer } from "./color.ts";

export class Logger extends BaseLogger<CollectedIssue> {
  readonly issuer: Issuer<CollectedIssue>;

  constructor(options: Options = {}) {
    super(options);
    this.issuer = new Issuer(this.state);
  }

  get colorizer(): Colorizer | undefined {
    return this.state.colorizer;
  }

  get stdout(): WriteStream {
    return this.state.stdout;
  }

  get stderr(): WriteStream {
    return this.state.stderr;
  }

  step(name: string): StepperHandle {
    this.startStep(name);
    return new StepperHandle(this.state, name);
  }
}
