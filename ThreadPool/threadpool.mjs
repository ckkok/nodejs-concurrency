import EventEmitter from 'events';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { readFileSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const numCpus = cpus().length;

const asyncWorkerScript = readFileSync(__dirname + '/asyncWorker.js', 'utf8');
const bootstrapWorkerScript = readFileSync(__dirname + '/bootstrapWorker.js', 'utf8');

const nameRegistry = {};

const AVAILABLE = Symbol('Worker available');
const DEFAULT_BUFFER_SIZE_PER_WORKER = 65536 + 4; // default highwatermark for streams + 4 bytes for synchronization uses (Int32)

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
    return new Promise(resolve => {
      this.postMessage(msg, ...transferList);
      const resolverFunc = response => {
        resolve({worker: this, response});
      }
      this.once('message', resolverFunc);
    })
  }
}

class BootstrappedWorker extends PooledWorker {
  constructor(threadPool, ...args) {
    super(threadPool, ...args);
    this.addFunction = this.addFunction.bind(this);
    this.run = this.run.bind(this);
    this.reset = this.reset.bind(this);
  }

  addFunction(func) {
    if (typeof func !== 'function') {
      throw new TypeError('Argument passed to thread for bootstrapping is not a function: ' + func.toString());
    }
    return new Promise(resolve => {
      this.postMessage({type: 'func', payload: func.toString()});
      this.once('message', reply => resolve({worker: this, response: reply}));
    })
  }

  run(funcName, ...args) {
    return new Promise(resolve => {
      this.postMessage({type: 'run', payload: funcName, args});
      this.once('message', reply => resolve({worker: this, response: reply}));
    })
  }

  reset() {
    this.postMessage({type: 'reset'});
    this.once('message', reply => this.release());
  }
}

const defaultOpts = {
  toEval: false, 
  initialSize: numCpus, 
  maxSize: numCpus, 
  bufferSize: DEFAULT_BUFFER_SIZE_PER_WORKER * numCpus,
  name: 'ThreadPool'
};

export class ThreadPool extends EventEmitter {
  constructor(opts, ...args) {
    let { file, toEval, initialSize, maxSize, bufferSize, name } = {...defaultOpts, ...opts};
    if (opts.bufferSize === undefined && maxSize > numCpus) {
      bufferSize = DEFAULT_BUFFER_SIZE_PER_WORKER * maxSize;
    }
    if (file === undefined) {
      throw ReferenceError('Filename / script is needed for thread pool construction');
    }
    if (initialSize <= 0) {
      throw RangeError('Size of thread pool must be at least 1');
    }
    if (maxSize < initialSize) {
      throw RangeError('Maximum size of thread pool must be at least its initial size');
    }
    super();
    if (nameRegistry[name] === undefined) {
      nameRegistry[name] = 0;
    }
    nameRegistry[name]++;

    this.getBufferView = this.getBufferView.bind(this);
    this.releaseThread = this.releaseThread.bind(this);
    this.getThread = this.getThread.bind(this);
    this._createThread = this._createThread.bind(this);

    this.name = name + '-' + nameRegistry[name];
    this.file = file;
    this.toEval = toEval;
    this.pool = [];
    this.busy = new Set();
    this.buffer = new SharedArrayBuffer(bufferSize);
    this.bufferView = new Int32Array(this.buffer);
    this.memLock = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
    this.currentCapacity = 0;
    this.maxSize = maxSize;
    this.threadArgs = args;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this._createThread(...args));
    }
  }

  getBufferView() {
    return this.bufferView;
  }

  getThread() {
    return new Promise(resolve => {
      if (this.currentCapacity <= this.maxSize) {
        const worker = this.pool.length > 0 ? this.pool.pop() : this._createThread(...this.threadArgs);
        this.busy.add(worker);
        resolve(worker);
      } else {
        const resolverFunc = () => {
          if (this.pool.length > 0) {
            const worker = this.pool.pop();
            this.busy.add(worker);
            resolve(worker);
          }
        }
        this.once(AVAILABLE, resolverFunc);
      }
    })
  }

  _createThread(...args) {
    this.currentCapacity++;
    return new PooledWorker(this, this.file, { eval: this.toEval, workerData: { buffer: this.buffer, memLock: this.memLock, args}}); 
  }

  releaseThread(worker) {
    this.pool.push(worker);
    this.busy.delete(worker);
    this.emit(AVAILABLE);
  }
}

export class AsyncThreadPool extends ThreadPool {
  constructor(initialSize = numCpus, maxSize = initialSize) {
    super({file: asyncWorkerScript, toEval: true, initialSize, maxSize, bufferSize: DEFAULT_BUFFER_SIZE_PER_WORKER * maxSize, name: 'AsyncThreads'});
  }

  run(func, ...args) {
    return new Promise(resolve => {
      this.getThread().then(worker => {
        const resolverFunc = msg => {
          worker.release();
          resolve(msg);
        }
        worker.once('message', resolverFunc);
        worker.postMessage({func: func.toString(), args})
      })
    })
  }
}

export class ExecutionThreadPool extends ThreadPool {
  constructor(initialSize = numCpus, maxSize = initialSize, bufferSize = DEFAULT_BUFFER_SIZE_PER_WORKER * maxSize, name = 'ExecutionThreads', ...args) {
    const opts = {
      file: bootstrapWorkerScript,
      toEval: true,
      initialSize,
      maxSize,
      bufferSize,
      name
    }
    super(opts, ...args);
  }

  _createThread(...args) {
    this.currentCapacity++;
    return new BootstrappedWorker(this, this.file, { eval: this.toEval, workerData: { buffer: this.buffer, args}}); 
  }

}
