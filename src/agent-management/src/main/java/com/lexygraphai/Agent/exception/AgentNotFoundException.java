package com.lexygraphai.Agent.exception;

public class AgentNotFoundException extends RuntimeException {
    public AgentNotFoundException(String agentId) {
        super("Agent not found with ID: " + agentId);
    }
}
