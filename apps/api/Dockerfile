FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline
COPY src src
RUN mvn package -DskipTests


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install bash, postgresql-client, and download mc (MinIO Client) CLI
RUN apk add --no-cache bash postgresql-client wget && \
    wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc

RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R spring:spring /app
USER spring:spring
EXPOSE 9090
ENTRYPOINT ["java", "-jar", "app.jar"]
