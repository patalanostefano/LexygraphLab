FROM openjdk:17-slim

WORKDIR /app

# Copy the Maven POM file
COPY pom.xml .

# Copy the source code
COPY src ./src

# Copy Maven wrapper if present
COPY .mvn ./.mvn
COPY mvnw ./mvnw
COPY mvnw.cmd ./mvnw.cmd

# Build the application
RUN if [ -f "./mvnw" ]; then \
      chmod +x ./mvnw && ./mvnw package -DskipTests; \
    else \
      apt-get update && apt-get install -y maven && \
      mvn package -DskipTests; \
    fi

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "target/*.jar"]

# Expose the port the app runs on
EXPOSE 8080
