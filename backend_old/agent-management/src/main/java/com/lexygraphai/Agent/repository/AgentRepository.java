package com.lexygraphai.Agent.repository;

import com.lexygraphai.Agent.dto.Agent;
import com.lexygraphai.Agent.exception.*;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import org.springframework.stereotype.Repository;

@Repository
public class AgentRepository {

    private final DynamoDbTable<Agent> agentTable;

    public AgentRepository(DynamoDbClient dynamoDbClient) {
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();

        this.agentTable = enhancedClient.table("AgentTable", TableSchema.fromBean(Agent.class));
    }

    public Agent findById(String id) {
        Agent agent = agentTable.getItem(r -> r.key(k -> k.partitionValue(id)));
        if (agent == null) {
            throw new AgentNotFoundException(id);
        }
        return agent;
    }

    public void save(Agent agent) {
        agentTable.putItem(agent);
    }
}
