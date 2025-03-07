package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntitiesResponse {
    private UUID documentId;
    private List<Entity> entities;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Entity {
        private String text;
        private String type;
        private Float confidence;
        private Integer page;
        private Position position;
        private Map<String, Object> metadata;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Position {
            private Integer start;
            private Integer end;
        }
    }
}
