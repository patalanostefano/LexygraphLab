package com.lexygraphai.document.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDateTime;

/**
 * Represents the result of a document processing operation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class ProcessingResult {
    
    private String documentId;
    private String resultId;
    private String userId;
    private String agentId;
    private String workflowId;
    private String status;
    private String outputType;
    private String outputUrl;
    private String errorMessage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    @DynamoDbPartitionKey
    public String getDocumentId() {
        return documentId;
    }
    
    @DynamoDbSortKey
    public String getResultId() {
        return resultId;
    }
}
