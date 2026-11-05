FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline
COPY src src
RUN mvn package -DskipTests


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy mc (MinIO Client) CLI from official Docker image (prevents external download timeouts)
COPY --from=minio/mc:latest /bin/mc /usr/local/bin/mc

# Install bash and postgresql-client
RUN apk add --no-cache bash postgresql-client && \
    chmod +x /usr/local/bin/mc

RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R spring:spring /app
USER spring:spring
EXPOSE 9090
ENTRYPOINT ["java", "-jar", "app.jar"]
