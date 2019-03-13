import { workerData, parentPort } from 'worker_threads';

parentPort.on('message', jsonObject => {
  const result = JSON.stringify(jsonObject);
  parentPort.postMessage(result);
})