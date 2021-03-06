import { workerData, threadId, parentPort } from 'worker_threads';
import * as Primes from '../lib/primes';

const { buffer } = workerData;
const view = new Int32Array(buffer);
const dataView = new Int32Array(workerData.args[0]);

const useBigInt = false;
const processor = useBigInt ? Primes.getNthPrime : Primes.getNthPrimeNumber;

// parentPort.on('message', signal => {
//   parentPort.postMessage(processor(dataView[threadId]));
// })

while (1) {
  Atomics.wait(view, threadId, 0);
  parentPort.postMessage(processor(dataView[threadId]));
}