import EventEmitter from 'events';
import { Worker } from 'worker_threads';
import os from 'os';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const numCpus = os.cpus().length;

const asyncWorkerScript = fs.readFileSync(__dirname + '/asyncWorker.js', 'utf8');
const bootstrapWorkerScript = fs.readFileSync(__dirname + '/bootstrapWorker.js', 'utf8');

const TRACE = 100;
const DEBUG = 200;
const INFO = 300;
const WARN = 400;
const ERROR = 500;
const FATAL = 600;

export class SimpleLogger {
  constructor(logger = console.log, level = FATAL) {
    this.loggers = new Set();
    this.loggers.add(logger);
    this.level = level;
  }

  setLevel(level) {
    this.level = level;
  }
  
  trace(...msg) {
    if (this.level <= TRACE) {
      this.loggers.forEach(logger => logger(...msg));
    }
  }

  debug(...msg) {
    if (this.level <= DEBUG) {
      this.loggers.forEach(logger => logger(...msg));
    }
  }

  info(...msg) {
    if (this.level <= INFO) {
      this.loggers.forEach(logger => logger(...msg));
    }
  }

  warn(...msg) {
    if (this.level <= WARN) {
      this.loggers.forEach(logger => logger(...msg));
    }
  }

  error(...msg) {
    if (this.level <= ERROR) {
      this.loggers.forEach(logger => logger(...msg));
    }
  }

  fatal(...msg) {
    if (this.level <= FATAL) {
      this.loggers.forEach(logger => logger(...msg));
    }
  }
}

let internalCount = {};

const Logger = new SimpleLogger();

const AVAILABLE = Symbol('Worker available');

class PooledWorker extends Worker {
  constructor(threadPool, ...args) {
    super(...args);
    this.threadPool = threadPool;
    this.release = this.release.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  release() {
    this.threadPool.releaseThread(this);
  }

  sendMessage(msg, ...transferList) {
    return new Promise((resolve, reject) => {
      this.postMessage(msg, ...transferList);
      const resolverFunc = response => {
        this.removeListener('message', resolverFunc);
        resolve({worker: this, response});
      }
      this.on('message', resolverFunc);
    })
  }
}

export class ThreadPool extends EventEmitter {
  constructor(opts, ...args) {
    const defaultOpts = {toEval: false, initialSize: numCpus, maxSize: numCpus, bufferSize: 65536 * numCpus, name: 'ThreadPool'};
    const { file, toEval, initialSize, maxSize, bufferSize, name } = {...defaultOpts, ...opts};
    if (file === null || file === undefined) {
      throw ReferenceError('File not found for worker thread construction');
    }
    super();
    if (internalCount[name] === undefined) {
      internalCount[name] = 0;
    }
    internalCount[name]++;
    this.name = name + '-' + internalCount[name];
    this.file = file;
    this.toEval = toEval;
    this.pool = [];
    this.busy = new Set();
    this.buffer = new SharedArrayBuffer(bufferSize);
    this.dataView = new Int32Array(this.buffer);
    this.bufLock = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    this.currentCapacity = initialSize;
    this.maxSize = maxSize;
    this.threadArgs = args;
    for (let i = 0; i < initialSize; i++) {
      this.releaseThread(this._createThread(...args));
    }
    this.getBuffer = this.getBuffer.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.releaseThread = this.releaseThread.bind(this);
    this.getThread = this.getThread.bind(this);
    this.getCapacity = this.getCapacity.bind(this);
    this._createThread = this._createThread.bind(this);
  }

  getBuffer() {
    return this.dataView;
  }

  broadcast(msg) {
    this.busy.forEach(worker => worker.postMessage(msg));
  }

  getThread() {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        const worker = this.pool.pop();
        this.busy.add(worker);
        Logger.debug(this.name + ': Remaining workers = ' + this.pool.length + ', in use = ' + this.busy.size);
        resolve(worker);
      } else if (this.currentCapacity < this.maxSize) {
        this.currentCapacity++;
        Logger.warn(this.name + ': Out of workers. Increasing capacity to ' + this.currentCapacity);
        const worker = this._createThread(...this.threadArgs);
        this.busy.add(worker);
        Logger.debug(this.name + ': In use = ' + this.busy.size);
        resolve(worker);
      } else {
        Logger.warn(this.name + ': Out of workers. Maximum capacity reached - ' + this.currentCapacity + '. Awaiting worker to be freed. In use = ' + this.busy.size);
        const resolverFunc = () => {
          if (this.pool.length > 0) {
            Logger.debug(this.name + ': Remaining workers = ' + this.pool.length);
            const worker = this.pool.pop();
            this.busy.add(worker);
            Logger.debug(this.name + ': In use = ' + this.busy.size);
            resolve(worker);
            return;
          }
        }
        this.once(AVAILABLE, resolverFunc);
      }
    })
  }

  _createThread(...args) {
    return new PooledWorker(this, this.file, { eval: this.toEval, workerData: { buffer: this.buffer, bufLock: this.bufLock, args}}); 
  }

  releaseThread(worker) {
    this.pool.push(worker);
    this.busy.delete(worker);
    Logger.debug(this.name + ': Worker released. In use = ' + this.busy.size);
    this.emit(AVAILABLE);
  }

  getCapacity() {
    return this.currentCapacity;
  }
}

export class AsyncThreadPool extends ThreadPool {
  constructor(initialSize = numCpus, maxSize = initialSize) {
    super({file: asyncWorkerScript, toEval: true, initialSize, maxSize, bufferSize: 65536, name: 'AsyncThreads'});
  }

  run(func, ...args) {
    return new Promise((resolve, reject) => {
      this.getThread().then(worker => {
        const resolverFunc = msg => {
          worker.removeListener('message', resolverFunc);
          worker.release();
          resolve(msg);
        }
        worker.on('message', resolverFunc);
        worker.postMessage({func: func.toString(), args})
      })
    })
  }
}

class BootstrappedWorker extends Worker {
  constructor(threadPool, ...args) {
    super(...args);
    this.threadPool = threadPool;
  }

  release() {
    this.threadPool.releaseThread(this);
  }

  sendMessage(msg, ...transferList) {
    return new Promise((resolve, reject) => {
      this.postMessage(msg, ...transferList);
      const resolverFunc = response => {
        this.removeListener('message', resolverFunc);
        resolve({worker: this, response});
      }
      this.on('message', resolverFunc);
    })
  }

  addFunction(func) {
    return new Promise((resolve, reject) => {
      this.postMessage({type: 'func', payload: func.toString()});
      this.once('message', reply => resolve({worker: this, response: reply}));
    })
  }

  run(funcName, ...args) {
    return new Promise((resolve, reject) => {
      this.postMessage({type: 'run', payload: funcName, args});
      this.once('message', reply => resolve({worker: this, response: reply}));
    })
  }

  reset() {
    this.postMessage({type: 'reset'});
    this.once('message', reply => this.release());
  }
}

export class ExecutionThreadPool extends EventEmitter {
  constructor(initialSize = numCpus, maxSize = initialSize, bufferSize = 65536 * maxSize, name = 'ExecutionThreads', ...args) {
    super();
    if (internalCount[name] === undefined) {
      internalCount[name] = 0;
    }
    internalCount[name]++;
    this.name = name + '-' + internalCount[name];
    this.file = bootstrapWorkerScript;
    this.toEval = true;
    this.pool = [];
    this.busy = new Set();
    this.buffer = new SharedArrayBuffer(bufferSize);
    this.currentCapacity = initialSize;
    this.maxSize = maxSize;
    this.threadArgs = args;
    for (let i = 0; i < initialSize; i++) {
      this.releaseThread(this._createThread(...args));
    }
  }

  getBuffer() {
    return this.buffer;
  }

  getThread() {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        const worker = this.pool.pop();
        this.busy.add(worker);
        Logger.debug(this.name + ': Remaining workers = ' + this.pool.length + ', in use = ' + this.busy.size);
        resolve(worker);
      } else if (this.currentCapacity < this.maxSize) {
        Logger.warn(this.name + ': Out of workers. Increasing capacity to ' + (++this.currentCapacity));
        const worker = this._createThread(...this.threadArgs);
        this.busy.add(worker);
        Logger.debug(this.name + ': In use = ' + this.busy.size);
        resolve(worker);
      } else {
        Logger.warn(this.name + ': Out of workers. Maximum capacity reached - ' + this.currentCapacity + '. Awaiting worker to be freed. In use = ' + this.busy.size);
        const resolverFunc = () => {
          if (this.pool.length > 0) {
            Logger.debug(this.name + ': Remaining workers = ' + this.pool.length);
            this.removeListener(AVAILABLE, resolverFunc);
            const worker = this.pool.pop();
            this.busy.add(worker);
            Logger.debug(this.name + ': In use = ' + this.busy.size);
            resolve(worker);
            return;
          }
        }
        this.on(AVAILABLE, resolverFunc);
      }
    })
  }

  _createThread(...args) {
    return new BootstrappedWorker(this, this.file, { eval: this.toEval, workerData: { buffer: this.buffer, args}}); 
  }

  releaseThread(worker) {
    this.pool.push(worker);
    this.busy.delete(worker);
    Logger.debug(this.name + ': Worker released. In use = ' + this.busy.size);
    this.emit(AVAILABLE);
  }

  getCapacity() {
    return this.currentCapacity;
  }
}
