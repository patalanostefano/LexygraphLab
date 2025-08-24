package com.lexygraphai.Agent.exception;

public class DocumentNotFoundException extends RuntimeException {
    public DocumentNotFoundException(String docId) {
        super("Document not found with ID: " + docId);
    }
}
