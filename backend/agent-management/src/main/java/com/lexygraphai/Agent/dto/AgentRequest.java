package com.lexygraphai.Agent.dto;

import com.lexygraphai.Agent.model.AgentType;
import jdk.internal.agent.resources.agent;
import com.lexygraphai.Agent.dto.*;

import java.util.List;
import java.util.Map;

public class AgentRequest {

    private String agentId;
    private String prompt;
    private List<String> documentIds;

    // Getters and Setters
    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public List<String> getDocumentIds() {
        return documentIds;
    }

    public void setDocumentIds(List<String> documentIds) {
        this.documentIds = documentIds;
    }
}


