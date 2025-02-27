FROM maven:3.8.1-openjdk-11
# Environment Variable that defines the endpoint of sentiment-analysis python api.
COPY . .
RUN mvn install
ENV LOGIC_API_URL http://localhost:5000
WORKDIR /target
EXPOSE 8080
CMD ["java", "-jar", "sentiment-analysis-web-0.0.1-SNAPSHOT.jar", "--logic.api.url=${LOGIC_API_URL}"]