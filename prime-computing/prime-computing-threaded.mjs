import * as Primes from '../lib/primes';
import { ThreadPool, ExecutionThreadPool, AsyncThreadPool } from '../ThreadPool/threadpool';
import { Worker } from 'worker_threads';

const which = parseInt(process.argv[2], 10);

const useBigInt = true;
const preProcessor = useBigInt ? Primes.isPrime : Primes.isPrimeNumber;
const processor = useBigInt ? Primes.getNthPrime : Primes.getNthPrimeNumber;

const toCalc = [10000, 20000, 30000, 40000];
switch (which) {
  case 1:
    asyncFunc();
    break;
  case 2:
    indivThreads();
    break;
  case 3:
    asyncThreads();
    break;
  case 4:
    bootstrappedThreads();
    break;
  default:
    console.log('Invalid case');
    break;
}

function asyncFunc() {
  console.log('Naive Async');
  console.log('===========');
  const start = Date.now();
  const runAsync = n => {
    return new Promise(resolve => {
      resolve(processor(n));
    })
  }
  Promise.all(toCalc.map(runAsync)).then(results => {
    console.log(results);
    console.log('Time:', Date.now() - start);
  })

}

function indivThreads() {
  console.log('Individual Threads');
  console.log('==================');
  const workerScript = `
  const { workerData, parentPort } = require('worker_threads');
  const { getNthPrime, getNthPrimeNumber } = require('./lib/primes');
  const useBigInt = true;
  const processor = useBigInt ? getNthPrime : getNthPrimeNumber;
  parentPort.postMessage(processor(workerData));
  `;
  const results = [];
  const start = Date.now();
  toCalc.forEach(i => {
    const worker = new Worker(workerScript, { eval: true, workerData: i});
    worker.once('message', result => {
      results.push(result);
      if (results.length >= 4) {
        console.log(results);
        console.log('Time:', Date.now() - start);
      }
      worker.terminate();
      worker.unref();
    })
  })
}


function asyncThreads() {
  console.log('AsyncThreads');
  console.log('============')
  const asyncThreads = new AsyncThreadPool();
  const start = Date.now();
  Promise.all(toCalc.map(i => asyncThreads.run(processor, i))).then(results => {
    console.log(results);
    console.log('Time:', Date.now() - start);
    process.exit(0);
  })
}

function bootstrappedThreads() {
  console.log('Bootstrapped Thread Pool');
  console.log('========================');
  const executors = new ExecutionThreadPool();
  const start = Date.now();
  Promise.all(toCalc.map(i => {
    return executors.getThread()
                    .then(worker => worker.addFunction(preProcessor))
                    .then(stage => stage.worker.addFunction(processor))
                    .then(stage => {
                      return stage.worker.run(stage.response, i);
                    })
  })).then(stages => {
    const results = stages.map(stage => stage.response);
    console.log(results);
    console.log('Time:', Date.now() - start);
    stages.forEach(stage => stage.worker.reset());
    process.exit(0);
  })

}

console.log('This is outside');