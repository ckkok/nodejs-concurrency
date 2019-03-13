function isProbablePrime(p, k) {
  const bitLength = (p).toString(2).length;
  const n = (Math.min(k, Number.MAX_SAFE_INTEGER - 1) + 1) / 2;
  // Relationship between certainty k and number of rounds: https://webstore.ansi.org/standards/ascx9/ansix9802005
  let rnd = 0;
  if (bitLength < 100) {
    rnd = Math.min(n, 50);
    return millerRabinTest(p, rnd);
  } else if (bitLength < 256) {
    rnd = 27;
  } else if (bitLength < 512) {
    rnd = 15;
  } else if (bitLength < 768) {
    rnd = 8;
  } else if (bitLength < 1024) {
    rnd = 4;
  } else {
    rnd = 2;
  }
  return millerRabinTest(p, rnd) && lucasLehmerTest(p);
}

function isPrime(p) {
  if (p > 2n && !(p & 1n)) {
    return false;
  }
  if (p === 2n) {
    return true;
  }
  if (p <= 1n) {
      return false;
  }
  for (let i = 3n; i*i <= p; i++) {
    if (p % i === 0n) {
        return false;
    }
  }
  return true;
}

function isPrimeNumber(p) {
  if (p > 2 && !(p & 1)) {
    return false;
  }
  if (p === 2) {
    return true;
  }
  if (p <= 1) {
      return false;
  }
  for (let i = 3; i*i <= p; i++) {
    if (p % i === 0) {
        return false;
    }
  }
  return true;
}

function getFirstNPrimes(n) {
  const result = [];
  let p = 1n;
  while (n--) {
    p = getNextPrime(p);
    result.push(p);
  }
  return result;
}

function millerRabinTest(n, k) {
  let d = n - 1n;
  let r = 0n;
  while (!(d & 1n)) {
    d /= 2n;
    r++;
  }
  let a, x, y;
  Outer:
  while (k > 0) {
    a = BigInt(Math.floor(Math.random() * Number(n - 3n))) + 2n;
    x = (a**d) % n; // Warning: high probability of failure if these are not bigints.
    if (x === 1n || x === n - 1n) {
      k--;
      continue Outer;
    }
    y = r;
    while (y > 0) {
      x = (x*x) % n;
      if (x === (n - 1n)) {
        k--;
        continue Outer;
      }
      y--;
    }
    return false;
    k--;
  }
  return true;
}

function lucasLehmerTest(n) {
  let s = 4n, p = 0n, m = n + 1n;
  while (!(m & 1n)) {
    m /= 2n;
    p++;
  }
  p = p - 2n;
  while (p > 0) {
    s = ((s * s) - 2n) % n;
    p--;
  }
  return (s === 0n ? true : false);
}

function getNthPrime(n) {
  if (n === 1n) {
    return 2n;
  }
  let p = 2n;
  while (n >= 2n) {
    while (!isPrime(++p)) {}
    n--;
  }
  return p;
}

function getNthPrimeNumber(n) {
  if (n === 1) {
    return 2;
  }
  let p = 2;
  while (n >= 2) {
    while (!isPrimeNumber(++p)) {}
    n--;
  }
  return p;
}

function getNextPrime(p) {
  while (!isPrime(++p)) {}
  return p;
}

function getNextProbablePrime(p, k) {
  while (!isProbablePrime(++p, k)) {}
  return p;
}

function toMersenneNumber(n) {
  return 2n ** n - 1n;
}

function getNthMersennePrime(n) {
  let i = 1n, p = 2n, m = 3n;
  while (i < n) {
    do {
      p = getNextPrime(p);
      m = toMersenneNumber(p);
    } while (!lucasLehmerTest(m));
    i++;
  }
  return m;
}

function* primeMaker() {
  let p = 1n;
  while(true) {
    p = getNextPrime(p);
    let reset = yield(p);
    if (reset) {
      p = 1n;
    }
  }
}

const primeGenerator = primeMaker();

module.exports = {isProbablePrime, isPrime, isPrimeNumber, getFirstNPrimes, millerRabinTest, lucasLehmerTest, getNthPrime, getNthPrimeNumber, getNextPrime, getNextProbablePrime, getNthMersennePrime, primeGenerator}