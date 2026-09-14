FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline
COPY src src
RUN mvn package -DskipTests


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install bash, postgresql-client, curl, and download mc (MinIO Client) CLI from official GitHub releases
RUN apk add --no-cache bash postgresql-client curl && \
    curl -fsSL https://github.com/minio/mc/releases/download/RELEASE.2025-08-13T08-35-41Z/mc.linux-amd64.RELEASE.2025-08-13T08-35-41Z -o /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc

RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R spring:spring /app
USER spring:spring
EXPOSE 9090
ENTRYPOINT ["java", "-jar", "app.jar"]
