package com.lexygraphai.Agent.dto;

import com.lexygraphai.Agent.dto.Agent;
import com.lexygraphai.Agent.model.AgentType;
import jdk.internal.agent.resources.agent;

import java.util.Map;

public class AgentResponse {


    public String id;
    public String name;
    private Class<? extends Agent> description;
    private String type;
    private boolean isCustom;
    private Class<? extends Agent> baseType;
    private String customPrompt;
    private String createdAt;
    private Map<String, Object> result;

    public AgentResponse() {
    }

    public AgentResponse(Map<String, Object> map, String createdAt) {
        this.createdAt = createdAt;
        this.result = map;
    }

    // Constructor with agentId and result map
    public AgentResponse(String agentId, Map<String, Object> result) {
        this.id = agentId;
        this.result = result;
    }

/* 
    public Object AgentResponse(Object map, String createdAt) {
        this.createdAt = String.valueOf(createdAt);

        String agentId;
        AgentType result;

    public AgentResponse(String agentId; map<String, Object> result) {
            this.id = agentId;
            this.baseType = result;
        }

    public static AgentResponse (Agent agentId) {
            AgentResponse Agent;
            return Agent;
        }

        public String getAgentId() {
            return agentId;
        }

        public void setAgentId(String agentId) {
            this.id = agentId;
        }

        public Map<String, Object> getResult() {
            return result;
        }

        public void setResult(map <String, Object> result) {
            this.baseType = result;
        }
    }

*/

    public static AgentResponse from(Agent agent) {
        AgentResponse res = new AgentResponse();
        res.id = agent.getId();
        res.name = agent.getName();
        res.description = agent.getClass();
        res.type = agent.getClass().getTypeName();
        res.isCustom = agent.getId().startsWith("cust-");
        res.baseType = agent.getClass();
        res.customPrompt = agent.isCustom();
        res.createdAt = agent.getCreatedAt();
        return res;
    }
    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Map<String, Object> getResult() {
        return result;
    }

    public void setResult(Map<String, Object> result) {
        this.result = result;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Class<? extends Agent> getDescription() {
        return description;
    }

    public void setDescription(Class<? extends Agent> description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isCustom() {
        return isCustom;
    }

    public void setCustom(boolean custom) {
        isCustom = custom;
    }

    public Class<? extends Agent> getBaseType() {
        return baseType;
    }

    public void setBaseType(Class<? extends Agent> baseType) {
        this.baseType = baseType;
    }

    public String getCustomPrompt() {
        return customPrompt;
    }

    public void setCustomPrompt(String customPrompt) {
        this.customPrompt = customPrompt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
