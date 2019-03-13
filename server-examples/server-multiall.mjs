import * as Primes from '../lib/primes';
import cluster from 'cluster';
import os from 'os';
import fastify from 'fastify';
import { ThreadPool } from '../ThreadPool/threadpool';

const numCpus = os.cpus().length;

if (cluster.isMaster) {
  console.log('Master ' + process.pid + ' running');
  for (let i = 0; i < numCpus; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log('Worker ' + worker.process.pid + ' died');
  })
} else {
  console.log('Worker ' + process.pid + ' up');

  const dataBuffer = new SharedArrayBuffer( Int32Array.BYTES_PER_ELEMENT * 8);
  const pool = new ThreadPool({
    file: './worker-atomics.mjs',
    toEval: false,
    initialSize: 4,
    maxSize: 8,
    bufferSize: Int32Array.BYTES_PER_ELEMENT * 8,
    name: 'DeadPool'
  }, dataBuffer);

  const dataView = new Int32Array(dataBuffer);
  
  const schema = {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'number' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  }

  const requestHandler = async (req, reply) => {
    const start = Date.now();
    const worker = await pool.getThread();
    dataView[worker.threadId] = parseInt(req.params.num, 10);
    Atomics.notify(pool.getBuffer(), worker.threadId);
    worker.once('message', result => {
      reply.send({result, processingTime: Date.now() - start});
      worker.release();
    })
  }
  
  const server = fastify({ logger: false });
  
  server.get('/prime/:num', schema, requestHandler);
  
  server.listen(8080, () => {
    console.log("Up and at 'em");
  })
}

