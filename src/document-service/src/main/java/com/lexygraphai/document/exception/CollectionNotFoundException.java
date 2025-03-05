package com.lexygraphai.document.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a collection cannot be found
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class CollectionNotFoundException extends RuntimeException {
    
    public CollectionNotFoundException(String message) {
        super(message);
    }
    
    public CollectionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
