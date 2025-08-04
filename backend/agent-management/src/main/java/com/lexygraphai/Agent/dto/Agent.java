package com.lexygraphai.Agent.dto;

public class Agent {

    private String id; // "cust-xxx"
    private String name;
    private String description;
    private String baseType;
    private String customPrompt;
    private String createdAt;

    // Getters, Setters, isCustom()
    public String isCustom() {
        return id != null && id.startsWith("cust-");
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    // Getters and setters omitted for brevity
}

