export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private scope: string;
  private level: LogLevel;

  constructor(scope: string, level: LogLevel = LogLevel.INFO) {
    this.scope = scope;
    this.level = level;
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.scope}] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.scope}] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.scope}] ${message}`, ...args);
    }
  }

  public error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.scope}] ${message}`, ...args);
    }
  }
}
