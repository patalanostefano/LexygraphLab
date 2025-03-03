package com.lexygraphai.document.config;

import com.lexygraphai.document.service.FileSystemStorageService;
import com.lexygraphai.document.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class StorageConfig {

    @Primary
    @Bean
    @ConditionalOnProperty(name = "document.storage.type", havingValue = "local", matchIfMissing = true)
    public StorageService fileSystemStorageService(@Value("${document.storage.local.directory}") String storageDir) {
        return new FileSystemStorageService(storageDir);
    }
}
