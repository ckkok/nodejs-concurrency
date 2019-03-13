import * as Primes from '../lib/primes';
import cluster from 'cluster';
import os from 'os';
import fastify from 'fastify';

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

  const useBigInt = true;
  const processor = useBigInt ? Primes.getNthPrime : Primes.getNthPrimeNumber;
  
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
    const result = processor(limit);
    reply.send({result, processingTime: Date.now() - start});
  }
  
  const server = fastify({ logger: false });
  
  server.get('/prime/:num', schema, requestHandler);
  
  server.listen(8080, () => {
    console.log("Up and at 'em");
  })
}

