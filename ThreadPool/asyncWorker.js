const { parentPort, threadId, workerData } = require('worker_threads');

parentPort.on('message', msg => {
  parentPort.postMessage((new Function('return ' + msg.func)())(...msg.args));
})
