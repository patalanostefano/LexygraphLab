package com.lexygraphai.document.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

/**
 * Represents a chunk of text extracted from a document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class DocumentChunk {

    private String documentId;
    private String chunkId;
    private String userId;
    private String content;
    private String section;
    private Integer pageNumber;
    private Integer order;
    private byte[] embedding;

    @DynamoDbPartitionKey
    public String getDocumentId() {
        return documentId;
    }

    @DynamoDbSortKey
    public String getChunkId() {
        return chunkId;
    }
    
    @DynamoDbSecondaryPartitionKey(indexNames = {"UserChunksIndex"})
    public String getUserId() {
        return userId;
    }
}
