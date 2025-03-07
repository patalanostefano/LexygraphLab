package com.docprocessing.document.service;

import java.util.UUID;

public interface QueueService {
    void queueDocumentForProcessing(UUID documentId, 
                                   String userId, 
                                   String processingType, 
                                   String processingOptions, 
                                   String priority,
                                   String language);
}
