package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Entity {
    private String text;
    private String type;
    private Float confidence;
    private Integer page;
    private Position position;
    private Map<String, Object> metadata;
}