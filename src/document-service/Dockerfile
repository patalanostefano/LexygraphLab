FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Add a non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Set Spring user as the owner of the app directory
RUN chown -R spring:spring /app

# Copy the JAR file
COPY target/*.jar app.jar

# Create directories for file storage
RUN mkdir -p /data/document-storage && \
    chown -R spring:spring /data

# Switch to the Spring user
USER spring:spring

# Configure volume for document storage
VOLUME /data/document-storage

# Expose application port
EXPOSE 8082

# Run the application with optimized JVM settings
ENTRYPOINT ["java", \
            "-XX:+UseContainerSupport", \
            "-XX:MaxRAMPercentage=75.0", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", "/app/app.jar"]
