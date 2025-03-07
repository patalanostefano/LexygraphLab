package com.docprocessing.document.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Collection {
    private UUID id;
    private String name;
    private String description;
    private Integer documentCount;
    private Instant createdAt;
    private Instant updatedAt;
    private String ownerId;
    private String thumbnailUrl;
    
    @DynamoDbPartitionKey
    @JsonIgnore
    public String getPK() {
        return "user#" + ownerId;
    }
    
    @DynamoDbSortKey
    @JsonIgnore
    public String getSK() {
        return "collection#" + id.toString();
    }
}
