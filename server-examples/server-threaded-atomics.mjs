import fastify from 'fastify';
import { ThreadPool } from '../ThreadPool/threadpool';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dataBuffer = new SharedArrayBuffer( Int32Array.BYTES_PER_ELEMENT * 65536);
const pool = new ThreadPool({
  file: __dirname + '/worker-atomics.mjs',
  toEval: false,
  initialSize: 4,
  maxSize: 8,
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
const requestHandler = (req, reply) => {
  const start = Date.now();
  pool.getThread().then(worker => {
    dataView[worker.threadId] = parseInt(req.params.num, 10);
    worker.once('message', result => {
      worker.release();
      reply.send({result, processingTime: Date.now() - start});
    });
    Atomics.notify(pool.getBufferView(), worker.threadId);
  })
}

const server = fastify({ logger: false });

server.get('/prime/:num', schema, requestHandler);

server.listen(8080, () => {
  console.log("Up and at 'em");
})