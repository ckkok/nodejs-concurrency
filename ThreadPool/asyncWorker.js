const { parentPort, threadId, workerData } = require('worker_threads');
// const _Lock = require('./Lock');

// const Lock = new _Lock(workerData.bufLock);

parentPort.on('message', msg => {
  parentPort.postMessage((new Function('return ' + msg.func)())(...msg.args));
})
