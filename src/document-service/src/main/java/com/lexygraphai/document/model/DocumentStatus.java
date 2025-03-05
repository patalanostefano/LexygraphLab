package com.lexygraphai.document.model;

/**
 * Represents the processing status of a document
 */
public enum DocumentStatus {
    PENDING,    // Document is uploaded but not yet processed
    PROCESSING, // Document is currently being processed
    COMPLETED,  // Document processing is successfully completed
    FAILED      // Document processing failed
}
