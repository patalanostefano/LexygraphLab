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

    public Object AgentResponse(Object map, String createdAt) {
        this.createdAt = String.valueOf(createdAt);

        String agentId;
        AgentType result;

    public AgentResponse(String agentId, map<String, Object> result) {
            this.id = agentId;
            this.baseType = result;
        }

        public static AgentResponse from(Agent agentId) {
            AgentResponse Agent;
            return;
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

        public void setResult(map<String, Object> result) {
            this.baseType = result;
        }
    }



    public static AgentResponse from(Agent agent) {
        AgentResponse res = new AgentResponse();
        res.id = agent.getId();
        res.name = agent.getName();
        res.description = agent.getClass();
        res.type = agent.getClass().getTypeName();
        res.isCustom = agent.getId().startsWith("cust-");
        res.baseType = agent.getClass();
        res.customPrompt = agent.isCustom();
        res.createdAt = agent.();
        return res;
    }
    // Getters and setters
}
