import { Worker } from 'worker_threads';

const script = `
const { threadId, workerData, parentPort } = require('worker_threads');
const UNLOCKED = 0;
const LOCKED = 1;
const dataView = new Int32Array(workerData);

function tester() {
  console.log(threadId, 'retrieved lock value of', Atomics.compareExchange(dataView, 0, UNLOCKED, threadId), 'and set lock to', Atomics.load(dataView, 0));
  console.log(threadId, 'retrieved lock value of', Atomics.compareExchange(dataView, 0, threadId, UNLOCKED), 'and set it back to', Atomics.load(dataView, 0));
}
parentPort.on('message', tester);
`;

const view = (new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT*2));
const workers = [];
for (let i = 0; i < 4; i++) {
  workers.push(new Worker(script, { eval: true, workerData: view }));
}
workers.forEach(worker => worker.postMessage(0));

