const TRACE = 100;
const DEBUG = 200;
const INFO = 300;
const WARN = 400;
const ERROR = 500;
const FATAL = 600;
const CONTEXT_DEFAULT = 'SimpleLogger';

export default class SimpleLogger {
  constructor(context = CONTEXT_DEFAULT, logger = console.log, level = INFO) {
    this.loggers = new Set();
    this.loggers.add(logger);
    this.level = level;
    this.context = context + ':';
    this.setLevel = this.setLevel.bind(this);
    this.trace = this.trace.bind(this);
    this.debug = this.debug.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.fatal = this.fatal.bind(this);
  }

  setLevel(level) {
    this.level = level;
  }
  
  trace(...msg) {
    if (this.level <= TRACE) {
      this.loggers.forEach(logger => logger(this.context, ...msg));
    }
  }

  debug(...msg) {
    if (this.level <= DEBUG) {
      this.loggers.forEach(logger => logger(this.context, ...msg));
    }
  }

  info(...msg) {
    if (this.level <= INFO) {
      this.loggers.forEach(logger => logger(this.context, ...msg));
    }
  }

  warn(...msg) {
    if (this.level <= WARN) {
      this.loggers.forEach(logger => logger(this.context, ...msg));
    }
  }

  error(...msg) {
    if (this.level <= ERROR) {
      this.loggers.forEach(logger => logger(this.context, ...msg));
    }
  }

  fatal(...msg) {
    if (this.level <= FATAL) {
      this.loggers.forEach(logger => logger(this.context, ...msg));
    }
  }
}