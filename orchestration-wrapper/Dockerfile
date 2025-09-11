# ---- build stage (immutato) ----
    FROM maven:3.9.6-eclipse-temurin-17 AS build
    WORKDIR /src
    COPY pom.xml .
    RUN mvn -q -DskipTests dependency:go-offline
    COPY src ./src
    RUN mvn -q -DskipTests package
    
    # ---- runtime stage ----
    FROM eclipse-temurin:17-jre-alpine
    WORKDIR /app
    
    # >>> AGGIUNTA: installa curl per l'healthcheck
    RUN apk add --no-cache curl
    
    # facoltativo: utente non-root
    # RUN addgroup -S app && adduser -S app -G app
    # USER app
    
    COPY --from=build /src/target/orchestration-wrapper-*.jar /app/app.jar
    EXPOSE 8010
    
    # >>> AGGIUNTA: healthcheck interno (matcha quello del compose)
    HEALTHCHECK --interval=20s --timeout=10s --retries=5 --start-period=30s \
      CMD curl -fsS http://localhost:8010/health || exit 1
    
    ENTRYPOINT ["java","-jar","/app/app.jar"]