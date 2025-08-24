package com.lexygraphai.Agent.model;

import java.util.Map;
import java.util.Set;

public enum AgentType implements Map<String, Object> {
    EXTRACTION,
    GENERATION,
    FORM_FILLING,
    ORCHESTRATION;

    public static AgentType fromString(String value) {
        return AgentType.valueOf(value.toUpperCase());
    }

    @Override
    public int size() {
        return 0;
    }

    @Override
    public boolean isEmpty() {
        return false;
    }

    @Override
    public boolean containsKey(Object key) {
        return false;
    }

    @Override
    public boolean containsValue(Object value) {
        return false;
    }

    @Override
    public Object get(Object key) {
        return null;
    }

    @Override
    public Object put(String key, Object value) {
        return null;
    }

    @Override
    public Object remove(Object key) {
        return null;
    }

    @Override
    public void putAll(Map<? extends String, ?> m) {

    }

    @Override
    public void clear() {

    }

    @Override
    public Set<String> keySet() {
        return null;
    }

    @Override
    public Set<Entry<String, Object>> entrySet() {
        return null;
    }
}

