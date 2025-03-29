package com.docprocessing.document.model;

import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class EntitiesResponse {
    private UUID documentId;
    private List<Entity> entities;
    
    @Data
    public static class Entity {
        private String text;
        private String type;
        private Float confidence;
        private Integer page;
        private Position position;
        private Map<String, Object> metadata;
        
        @Data
        public static class Position {
            private Integer start;
            private Integer end;
        }
    }
}
