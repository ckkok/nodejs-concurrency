// Cluster forking does not support .mjs fully!
const cluster = require('cluster');

if (cluster.isMaster) {

  const os = require('os');
  const numCpus = os.cpus().length;
  const workers = [];

  const NUM_WORKERS = 2;
  for (let i = 0; i < NUM_WORKERS; i++) {
    workers.push(cluster.fork());
  }

  for (const id in cluster.workers) {
    workers.push(id);
  }

  let count = 0;
  workers[0].on('message', data => {
    count = data;
    workers[1].send(data);
  })

  workers[1].on('message', data => {
    count = data;
    workers[0].send(data);
  })

  // Let's get this idiot ball rolling
  console.log('=== Let\'s get this ball rolling ===');
  const start = Date.now();
  workers[0].send(count);
  let i = 0;
  cluster.on('exit', (worker, code, signal) => {
    i++;
    if (i >= 2) {
      console.log('Time:', Date.now() - start);
      console.log(count);
      process.exit(0);
    }
  })

} else if (cluster.isWorker) {

  let i = 0;

  process.on('message', data => {
    i++;
    data++;
    process.send(data);
    if (i >= 10e4/2) {
      process.exit(0);
    }
  })

}