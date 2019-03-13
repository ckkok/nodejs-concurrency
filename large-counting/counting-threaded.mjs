import { Worker } from 'worker_threads';

const NUM_WORKERS = 2;

const workerJS = `
const { parentPort } = require('worker_threads');

let i = 0;
parentPort.on('message', msg => {
  i++;
  msg++;
  parentPort.postMessage(msg);
  if (i >= 10e4/2) {
    process.exit(0);
  }
});
`;
const workers = [];
for (let i = 0; i < NUM_WORKERS; i++) {
  workers[i] = new Worker(workerJS, { eval: true });
}

let count = 0;

workers[0].on('message', data => {
  count = data;
  workers[1].postMessage(data);
});

workers[1].on('message', data => {
  count = data;
  workers[0].postMessage(data);
});

console.log('=== Let\'s get this ball rolling ===');
const start = Date.now();
workers[0].postMessage(count);
let i = 0;
workers.forEach(worker => worker.on('exit', code => {
  i++;
  if (i >= NUM_WORKERS) {
    console.log('Time:', Date.now() - start);
    console.log(count);
    process.exit(0);
  }
}))