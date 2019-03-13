package com.example.primegenerator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.stream.IntStream;

class PrimeCalculatorServiceTest {

    private PrimeCalculatorService primeCalculatorService;

    @BeforeEach
    void setUp() {
        primeCalculatorService = new PrimeCalculatorService();
    }

    @Test
    void getNthPrime() {
        int[] cases = {10000, 20000, 30000, 40000};
        IntStream stream = Arrays.stream(cases);
        Long start = System.currentTimeMillis();
        stream.forEach(i -> System.out.println(primeCalculatorService.getNthPrime(BigInteger.valueOf(i))));
        System.out.println(System.currentTimeMillis() - start);
    }

    @Test
    void getMersennePrimes() {
        int numPrimes = 16;
        Long start = System.currentTimeMillis();
        IntStream.rangeClosed(1, numPrimes).forEach(i -> System.out.println(primeCalculatorService.getNthMersennePrime(BigInteger.valueOf(i))));
        System.out.println(System.currentTimeMillis() - start);
    }
}