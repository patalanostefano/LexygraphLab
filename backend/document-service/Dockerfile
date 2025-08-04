FROM amazon/aws-lambda-java:11

# Copy the JAR file
COPY target/document-service-1.0.0.jar ${LAMBDA_TASK_ROOT}/lib/document-service.jar

# Set handler
CMD ["com.docprocessing.document.StreamLambdaHandler::handleRequest"]
