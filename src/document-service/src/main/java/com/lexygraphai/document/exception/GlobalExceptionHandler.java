package com.lexygraphai.document.exception;

import com.lexygraphai.document.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DocumentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDocumentNotFound(
            DocumentNotFoundException ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.NOT_FOUND, 
                "Document not found", 
                ex.getMessage(), 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(CollectionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCollectionNotFound(
            CollectionNotFoundException ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.NOT_FOUND, 
                "Collection not found", 
                ex.getMessage(), 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ErrorResponse> handleStorageException(
            StorageException ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "Storage error", 
                ex.getMessage(), 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.BAD_REQUEST, 
                "Validation error", 
                ex.getMessage(), 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.BAD_REQUEST, 
                "Data integrity violation", 
                ex.getMessage(), 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, 
            HttpServletRequest request) {
        
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce("", (a, b) -> a + (a.isEmpty() ? "" : ", ") + b);
        
        return createErrorResponse(
                HttpStatus.BAD_REQUEST, 
                "Validation error", 
                errorMessage, 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE, 
                "File size exceeded", 
                "The uploaded file exceeds the maximum allowed size", 
                request.getRequestURI()
        );
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, 
            HttpServletRequest request) {
        
        return createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "Internal server error", 
                ex.getMessage(), 
                request.getRequestURI()
        );
    }
    
    private ResponseEntity<ErrorResponse> createErrorResponse(
            HttpStatus status, 
            String error, 
            String message, 
            String path) {
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .message(message)
                .path(path)
                .build();
        
        return new ResponseEntity<>(errorResponse, status);
    }
}
