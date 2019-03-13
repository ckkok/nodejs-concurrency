import { parentPort } from 'worker_threads';
import * as Primes from '../lib/primes';

const useBigInt = true;
const processor = useBigInt ? Primes.getNthPrime : Primes.getNthPrimeNumber;

parentPort.on('message', msg => {
  parentPort.postMessage(processor(msg));
})