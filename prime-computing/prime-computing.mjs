import * as Primes from '../lib/primes';

const which = parseInt(process.argv[2], 10);

const useBigInt = true;
const processor = useBigInt ? Primes.getNthPrime : Primes.getNthPrimeNumber;

switch (which) {
  case 1:
    calcPrimes();
    break;
  case 2:
    calcMersennePrimes(parseInt(process.argv[3], 10));
    break;
  default:
    console.log('Invalid case');
    break;
}

function calcPrimes() {
  console.log('Calculating Prime Numbers');
  console.log('=========================');
  const toCalc = [10000, 20000, 30000, 40000];
  const start = Date.now();
  toCalc.forEach(i => console.log(processor(i)));
  console.log('Time:', Date.now() - start);
}

function calcMersennePrimes(n) {
  console.log('Calculating Mersenne Primes (LARGE!!!)');
  console.log('======================================');
  const mersennePrimesToFind = Array.from(new Array(n), (v, i) => ++i);
  const start = Date.now();
  mersennePrimesToFind.forEach(i => {
    console.log(Primes.getNthMersennePrime(i));
  })
  console.log('Time:', Date.now() - start);
}