package com.docprocessing.document.exception;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ApiError {
    private String code;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, Object> details;
    
    public ApiError(String code, String message) {
        this.code = code;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }
    
    public ApiError(String code, String message, Map<String, Object> details) {
        this.code = code;
        this.message = message;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }
}
