package com.example.primegenerator;

import java.math.BigInteger;

public class BigIntResponseModel {
    private BigInteger result;

    public BigInteger getResult() {
        return result;
    }

    public Long getProcessingTime() {
        return processingTime;
    }

    private Long processingTime;

    public BigIntResponseModel(BigInteger result, Long processingTime) {
        this.result = result;
        this.processingTime = processingTime;
    }
}
