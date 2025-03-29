FROM openjdk:17-jdk-slim as build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apt-get update && apt-get install -y maven
RUN mvn package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/document-service-1.0.0.jar ./app.jar

# Environment variables for configuration
ENV RAW_BUCKET=arn:aws:s3:::valis-documents-raw
ENV DOCUMENTS_TABLE=valis-documents
ENV COLLECTIONS_TABLE=valis-document-collections
ENV DOC_PROCESSING_TABLE=valis-document-processing
ENV OCR_QUEUE=arn:aws:sqs:eu-central-1:078652648484:valis-documents-ocr-queue
ENV TEXT_PROCESSING_QUEUE=arn:aws:sqs:eu-central-1:078652648484:valis-documents-text-processing-queue
ENV SUMMARIZER_QUEUE=arn:aws:sqs:eu-central-1:078652648484:valis-documents-summarizer-queue
ENV PARSER_QUEUE=arn:aws:sqs:eu-central-1:078652648484:valis-documents-parser-queue
ENV AUTH_JWT_ISSUER=https://sjfdkgzmjaasjtavuhfu.supabase.co
ENV AUTH_JWT_JWK_SET_URI=https://sjfdkgzmjaasjtavuhfu.supabase.co/auth/v1/jwks

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
