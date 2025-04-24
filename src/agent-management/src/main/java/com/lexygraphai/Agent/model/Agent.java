package com.lexygraphai.Agent.model;

import java.time.Instant;

public class Agent {

    private String id;
    private String name;
    private String description;
    private AgentType baseType;
    private String customPrompt;
    private String createdAt;


    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public AgentType getBaseType() { return baseType; }
    public void setBaseType(AgentType baseType) { this.baseType = baseType; }

    public String getCustomPrompt() { return customPrompt; }
    public void setCustomPrompt(String customPrompt) { this.customPrompt = customPrompt; }

    public String getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
