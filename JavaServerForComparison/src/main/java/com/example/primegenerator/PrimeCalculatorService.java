package com.example.primegenerator;

import static java.math.BigInteger.*;
import org.springframework.stereotype.Service;

import java.math.BigInteger;

@Service
public class PrimeCalculatorService {
    private static final BigInteger THREE = BigInteger.valueOf(3L);

    public BigInteger getNthPrime(BigInteger n) {
        if (n.equals(ONE)) {
            return TWO;
        }
        BigInteger p = TWO;
        while (n.compareTo(TWO) >= 0) {
            do {
                p = p.add(ONE);
            } while (!isPrime(p));
            n = n.subtract(ONE);
        }
        return p;
    }

    public int getNthPrimeNumber(int n) {
        if (n == 1) {
            return 2;
        }
        int p = 2;
        while (n >= 2) {
            while (!isPrimeNumber(++p)) {}
            n--;
        }
        return p;
    }

    public boolean isPrime(BigInteger p) {
        if (p.compareTo(TWO) > 0 && p.remainder(TWO).equals(ZERO)) {
            return false;
        }
        if (p.equals(TWO)) {
            return true;
        }
        if (p.compareTo(ONE) <= 0) {
            return false;
        }
        for (BigInteger i = BigInteger.valueOf(3L); p.compareTo(i.multiply(i)) >= 0; i = i.add(ONE)) {
            if (p.remainder(i).equals(ZERO)) {
                return false;
            }
        }
        return true;
    }

    public boolean isPrimeNumber(int p) {
        if (p > 2 && (p % 2) == 0) {
            return false;
        }
        if (p == 2) {
            return true;
        }
        if (p <= 1) {
            return false;
        }
        for (int i = 3; i*i <= p; i++) {
            if (p % i == 0) {
                return false;
            }
        }
        return true;
    }

    public BigInteger getNextPrime(BigInteger p) {
        do {
            p = p.add(ONE);
        } while(!isPrime(p));
        return p;
    }

    public BigInteger toMersenneNumber(BigInteger n) {
        return (TWO.pow(n.intValue())).subtract(ONE);
    }

    public BigInteger getNthMersennePrime(BigInteger n) {
        BigInteger i = ONE;
        BigInteger p = TWO;
        BigInteger m = THREE;
        while (i.compareTo(n) < 0) {
            do {
                p = getNextPrime(p);
                m = toMersenneNumber(p);
            } while (!m.isProbablePrime(50));
            i = i.add(ONE);
        }
        return m;
    }
}
