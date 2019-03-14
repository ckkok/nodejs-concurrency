const { parentPort, workerData } = require('worker_threads');
const Primes = require('../lib/primes');

const useBigInt = false;
const processor = useBigInt ? Primes.getNthPrime : Primes.getNthPrimeNumber;

parentPort.postMessage(processor(workerData));