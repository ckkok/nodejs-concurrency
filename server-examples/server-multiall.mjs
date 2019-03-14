import cluster from 'cluster';
import os from 'os';
import fastify from 'fastify';
import { ThreadPool } from '../ThreadPool/threadpool';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
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
    file: __dirname + '/worker-atomics.mjs',
    toEval: false,
    initialSize: 4,
    maxSize: 8,
    name: 'ServerPool'
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
    worker.once('message', result => {
      reply.send({result, processingTime: Date.now() - start});
      worker.release();
    })
    Atomics.notify(pool.getBufferView(), worker.threadId);
  }
  
  const server = fastify({ logger: false });
  
  server.get('/prime/:num', schema, requestHandler);
  
  server.listen(8080, () => {
    console.log("Up and at 'em");
  })
}

