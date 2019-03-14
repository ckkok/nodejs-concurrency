import { Worker } from 'worker_threads';

const numWorkers = 2;

const workerJS = `
const { workerData, parentPort } = require('worker_threads');

parentPort.on('message', msg => {
  for (let i = 0; i < (10e6 / 2); i++) {
    // workerData[0]++;
    Atomics.add(workerData, 0, 1);
  }
  parentPort.postMessage(0);
});
`;
const workers = [];
const buffer = new SharedArrayBuffer( Int32Array.BYTES_PER_ELEMENT );
const view = new Int32Array(buffer);
view[0] = 0;
for (let i = 0; i < numWorkers; i++) {
  workers[i] = new Worker(workerJS, { eval: true, workerData: view });
}
const start = Date.now();
let numWorkersDone = 0;
for (let i = 0; i < numWorkers; i++) {
  workers[i].on('message', response => {
    numWorkersDone++;
    if (numWorkersDone === 2) {
      console.log('Time taken:', Date.now() - start)
      console.log(view[0]);
      for (let j = 0; j < numWorkers; j++) {
        workers[j].terminate();
        workers[j].unref();
      }
    }
  })
  workers[i].postMessage(0);
}
