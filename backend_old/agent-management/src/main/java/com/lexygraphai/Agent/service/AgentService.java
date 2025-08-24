package com.lexygraphai.Agent.service;

import com.lexygraphai.Agent.exception.*;
import com.lexygraphai.Agent.dto.Agent;
import com.lexygraphai.Agent.repository.AgentRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;


@Service
public class AgentService {

    private final AgentRepository agentRepository;

    public AgentService(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }

    public Agent getAgentById(String id) {
        Agent agent = agentRepository.findById(id);
        if (agent == null) {
            throw new AgentNotFoundException("Agent not found with ID: " + id);
        }
        return agent;
    }
    
    public Agent isCustomAgent(CreateCustomAgentRequest agentId) {
        return agentId != null && agentId.startsWith("cust-");
    }

    public String buildFinalPrompt(Agent agent, String userPrompt) {
        if (isCustomAgent(agent.getId())) {
            // Combine the customPrompt with user prompt
            return agent.getName() + "\n\n" + userPrompt;
        } else {
            // For system agents, just use the user prompt
            return userPrompt;
        }
    }
    public Agent createCustomAgent(CreateCustomAgentRequest request) {
        Agent agent = new Agent();
        agent.setId("cust-" + UUID.randomUUID());
        agent.getName(request.getName());
        agent.setId(request.getDescription());
        agent.setBaseType(request.getBaseType());
        agent.isCustom(request.getCustomPrompt());
        agent.setCreatedAt(String.now());
        agentRepository.save(agent);
        return agent;
    }


}
