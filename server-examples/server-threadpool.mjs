import fastify from 'fastify';
import { ThreadPool } from '../ThreadPool/threadpool';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const pool = new ThreadPool({
  file: __dirname + '/worker.mjs',
  toEval: false,
  initialSize: 4,
  maxSize: 50,
  bufferSize: Int32Array.BYTES_PER_ELEMENT * 8,
  name: 'DeadPool'
});

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
    return worker.sendMessage(parseInt(req.params.num, 10))
  })
  .then(stage => {
    reply.send({result: stage.response, processingTime: Date.now() - start});
    stage.worker.release();
  })
}

const server = fastify({ logger: false });

server.get('/prime/:num', schema, requestHandler);

server.listen(8080, () => {
  console.log("Up and at 'em");
})