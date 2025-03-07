file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/exception/GlobalExceptionHandler.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/exception/GlobalExceptionHandler.java
text:
```scala
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

```



#### Error stacktrace:

```
scala.collection.Iterator$$anon$19.next(Iterator.scala:973)
	scala.collection.Iterator$$anon$19.next(Iterator.scala:971)
	scala.collection.mutable.MutationTracker$CheckedIterator.next(MutationTracker.scala:76)
	scala.collection.IterableOps.head(Iterable.scala:222)
	scala.collection.IterableOps.head$(Iterable.scala:222)
	scala.collection.AbstractIterable.head(Iterable.scala:935)
	dotty.tools.dotc.interactive.InteractiveDriver.run(InteractiveDriver.scala:164)
	dotty.tools.pc.MetalsDriver.run(MetalsDriver.scala:45)
	dotty.tools.pc.WithCompilationUnit.<init>(WithCompilationUnit.scala:31)
	dotty.tools.pc.SimpleCollector.<init>(PcCollector.scala:345)
	dotty.tools.pc.PcSemanticTokensProvider$Collector$.<init>(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector$lzyINIT1(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.provide(PcSemanticTokensProvider.scala:88)
	dotty.tools.pc.ScalaPresentationCompiler.semanticTokens$$anonfun$1(ScalaPresentationCompiler.scala:109)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator