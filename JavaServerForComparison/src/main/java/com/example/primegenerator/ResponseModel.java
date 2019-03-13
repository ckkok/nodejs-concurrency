package com.example.primegenerator;

import java.math.BigInteger;

public class ResponseModel {
    private int result;

    public int getResult() {
        return result;
    }

    public Long getProcessingTime() {
        return processingTime;
    }

    private Long processingTime;

    public ResponseModel(int result, Long processingTime) {
        this.result = result;
        this.processingTime = processingTime;
    }
}
