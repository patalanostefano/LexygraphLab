package com.docprocessing.document.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

@Configuration
public class SQSConfig {

    @Value("${aws.region}")
    private String awsRegion;

    @Value("${aws.sqs.endpoint:#{null}}")
    private String endpoint;

    @Bean
    public SqsClient sqsClient() {
        if (endpoint != null && !endpoint.isEmpty()) {
            return SqsClient.builder()
                    .endpointOverride(URI.create(endpoint))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .region(Region.of(awsRegion))
                    .build();
        }
        return SqsClient.builder()
                .credentialsProvider(DefaultCredentialsProvider.create())
                .region(Region.of(awsRegion))
                .build();
    }
}
