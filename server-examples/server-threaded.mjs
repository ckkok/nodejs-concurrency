import fastify from 'fastify';
import fs from 'fs';
import { Worker } from 'worker_threads';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const workerScript = fs.readFileSync(__dirname + '/worker.js', 'utf8');

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
  const limit = parseInt(req.params.num, 10);
  // const worker = new Worker(workerScript, { eval: true, workerData: limit });
  const worker = new Worker(__dirname + '/worker.js', { workerData: limit });
  worker.once('message', result => {
    reply.send({result, processingTime: Date.now() - start});
    worker.terminate();
    worker.unref();
  })
}

const server = fastify({ logger: false });

server.get('/prime/:num', schema, requestHandler);

server.listen(8080, () => {
  console.log("Up and at 'em");
})