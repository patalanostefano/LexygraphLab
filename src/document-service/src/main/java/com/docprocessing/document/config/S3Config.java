package com.docprocessing.document.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${aws.region}")
    private String awsRegion;

    @Value("${aws.s3.endpoint:#{null}}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        if (endpoint != null && !endpoint.isEmpty()) {
            return S3Client.builder()
                    .endpointOverride(URI.create(endpoint))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .region(Region.of(awsRegion))
                    .build();
        }
        return S3Client.builder()
                .credentialsProvider(DefaultCredentialsProvider.create())
                .region(Region.of(awsRegion))
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        if (endpoint != null && !endpoint.isEmpty()) {
            return S3Presigner.builder()
                    .endpointOverride(URI.create(endpoint))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .region(Region.of(awsRegion))
                    .build();
        }
        return S3Presigner.builder()
                .credentialsProvider(DefaultCredentialsProvider.create())
                .region(Region.of(awsRegion))
                .build();
    }
}
