package com.example.primegenerator;

import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;

@RestController
@RequestMapping("/prime")
public class PrimeController {

    private PrimeCalculatorService primeCalculatorService;

    public PrimeController(PrimeCalculatorService primeCalculatorService) {
        this.primeCalculatorService = primeCalculatorService;
    }

    @GetMapping("/big/{num}")
    public BigIntResponseModel getPrime(@PathVariable("num") String num) {
        Long start = System.currentTimeMillis();
        BigInteger result = primeCalculatorService.getNthPrime(BigInteger.valueOf(Long.valueOf(num)));
        Long processingTime = System.currentTimeMillis() - start;
        return new BigIntResponseModel(result, processingTime);

    }

    @GetMapping("/{num}")
    public ResponseModel getLargePrime(@PathVariable("num") String num) {
        Long start = System.currentTimeMillis();
        int result = primeCalculatorService.getNthPrimeNumber(Integer.valueOf(num));
        Long processingTime = System.currentTimeMillis() - start;
        return new ResponseModel(result, processingTime);
    }
}
