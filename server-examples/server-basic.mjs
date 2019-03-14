import fastify from 'fastify';
import * as Primes from '../lib/primes';

const useBigInt = false;
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