const { workerData, parentPort } = require('worker_threads');

parentPort.on('message', signal => {
  const result = JSON.stringify(workerData);
  parentPort.postMessage(result);
})