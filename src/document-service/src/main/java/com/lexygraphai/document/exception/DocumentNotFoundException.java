package com.lexygraphai.document.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a document cannot be found
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class DocumentNotFoundException extends RuntimeException {
    
    public DocumentNotFoundException(String message) {
        super(message);
    }
    
    public DocumentNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
