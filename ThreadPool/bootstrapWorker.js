const { workerData, parentPort, threadId } = require('worker_threads');

let _funcRegistry = [];

let _anonFuncCount = 0;

function funcFactory(func) {
  const f = new Function('return ' + func)();
  const funcName = !f.name ? _anonFuncCount++ : f.name;
  global[funcName] = f;
  _funcRegistry.push(funcName);
  return funcName;
}

function cleanseScope() {
  for (let i = 0, j = _funcRegistry.length ; i < j; i++) {
    delete global[_funcRegistry[i]];
  }
  _funcRegistry = [];
  _anonFuncCount = 0;
}

parentPort.on('message', msg => {
  switch (msg.type) {
    case 'func':
      parentPort.postMessage(funcFactory(msg.payload));
      break;
    case 'run':
      parentPort.postMessage(global[msg.payload](...msg.args));
      break;
    case 'reset':
      cleanseScope();
      parentPort.postMessage(0);
      break;
    default:
      parentPort.postMessage(-1);
      break;
  }
})