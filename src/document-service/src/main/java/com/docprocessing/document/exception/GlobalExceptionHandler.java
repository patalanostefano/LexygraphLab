package com.docprocessing.document.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(DocumentNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDocumentNotFoundException(DocumentNotFoundException ex) {
        log.error("Document not found", ex);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", "DOCUMENT_NOT_FOUND");
        response.put("message", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    @ExceptionHandler(CollectionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleCollectionNotFoundException(CollectionNotFoundException ex) {
        log.error("Collection not found", ex);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", "COLLECTION_NOT_FOUND");
        response.put("message", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    @ExceptionHandler(NotAuthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleNotAuthorizedException(NotAuthorizedException ex) {
        log.error("Not authorized", ex);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", "NOT_AUTHORIZED");
        response.put("message", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error", ex);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", "INTERNAL_SERVER_ERROR");
        response.put("message", "An unexpected error occurred");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
