# ─── Stage 1: Builder (Compile & Package Fat JAR) ──────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline
COPY src src
RUN mvn package -DskipTests

# ─── Stage 2: Extractor (Spring Boot 3.4 Native Layer Extraction) ─────────────
FROM eclipse-temurin:21-jre-alpine AS extractor
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ─── Stage 3: Production Runtime (Alpine JRE 21 + Layered Classes) ─────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install bash, postgresql-client, and download mc (MinIO Client) CLI with resilient retry
RUN apk add --no-cache bash postgresql-client curl && \
    curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors \
      https://github.com/minio/mc/releases/download/RELEASE.2025-08-13T08-35-41Z/mc.linux-amd64.RELEASE.2025-08-13T08-35-41Z -o /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc && \
    apk del curl

RUN addgroup -S spring && adduser -S spring -G spring

# Copy extracted layers in order of least frequent change to most frequent change
# 1. Third-party dependencies (~85 MB) — rarely changed, permanently cached on server
COPY --from=extractor --chown=spring:spring /app/dependencies/ ./
# 2. Spring Boot loader (~200 KB) — rarely changed, permanently cached on server
COPY --from=extractor --chown=spring:spring /app/spring-boot-loader/ ./
# 3. Snapshot dependencies (if any) — cached on server
COPY --from=extractor --chown=spring:spring /app/snapshot-dependencies/ ./
# 4. K2NET Application code (~3-5 MB) — downloaded on routine code updates!
COPY --from=extractor --chown=spring:spring /app/application/ ./

USER spring:spring
EXPOSE 9090

# Official Spring Boot 3.2+ / 3.4+ launcher class
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
