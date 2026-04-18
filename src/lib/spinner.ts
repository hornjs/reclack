export class SpinnerHandle {
  private resolved = false;
  private readonly updateMessage: (message: string) => void;
  private readonly stop: () => void;
  private readonly writeInfo: (message: string) => void;
  private readonly writeError: (message: string) => void;

  constructor(
    updateMessage: (message: string) => void,
    stop: () => void,
    writeInfo: (message: string) => void,
    writeError: (message: string) => void,
  ) {
    this.updateMessage = updateMessage;
    this.stop = stop;
    this.writeInfo = writeInfo;
    this.writeError = writeError;
  }

  update(message: string): void {
    if (this.resolved) return;
    this.updateMessage(message);
  }

  done(message?: string): void {
    if (this.resolved) return;
    this.resolved = true;
    // Stop the live renderer before writing the final stable message.
    this.stop();
    if (message) this.writeInfo(message);
  }

  fail(message: string): void {
    if (this.resolved) return;
    this.resolved = true;
    this.stop();
    this.writeError(message);
  }
}
