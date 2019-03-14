import { Worker } from 'worker_threads';

const numWorkers = 2;

const workerJS = `
const { workerData, parentPort } = require('worker_threads');

parentPort.on('message', msg => {
  for (let i = 0; i < (10e6 / 2); i++) {
    // workerData[0]++;
    Atomics.add(workerData, 0, 1);
  }
  Atomics.add(workerData, 1, 1);
  if (Atomics.load(workerData, 1) === 2) {
    Atomics.notify(workerData, 1, 1);
  }
  process.exit(0);
});
`;
const workers = [];
const buffer = new SharedArrayBuffer( Int32Array.BYTES_PER_ELEMENT * 2 );
const view = new Int32Array(buffer);
view[0] = 0;
for (let i = 0; i < numWorkers; i++) {
  workers[i] = new Worker(workerJS, { eval: true, workerData: view });
}
const start = Date.now();
workers.forEach(worker => worker.postMessage(0));
Atomics.wait(view, 1, 0);
console.log('Time:', Date.now() - start);
console.log(view[0]);
