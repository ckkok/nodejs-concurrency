const { workerData, parentPort, threadId } = require('worker_threads');
// const _Lock = require('./Lock');

// const Lock = new _Lock(workerData.bufLock);

let _funcRegistry = [];

let _anonFuncCount = 0;

function funcFactory(func) {
  const f = new Function('return ' + func)();
  let funcName = !f.name ? _anonFuncCount++ : f.name;
  global[funcName] = f;
  _funcRegistry.push(funcName);
  return funcName;
}

function cleanseScope() {
  for (let i = 0, j = _funcRegistry.length ; i < j; i++) {
    global[_funcRegistry[i]] = undefined;
    _funcRegistry[i] = undefined;
  }
  _funcRegistry = [];
  _anonFuncCount = 0;
}

parentPort.on('message', msg => {
  if (msg.type === 'func') {
    const funcName = funcFactory(msg.payload);
    parentPort.postMessage(funcName);
  } else if (msg.type === 'run') {
    parentPort.postMessage(global[msg.payload](...msg.args));
  } else if (msg.type === 'reset') {
    cleanseScope();
    parentPort.postMessage(0);
  }
})