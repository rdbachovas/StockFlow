# syntax=docker/dockerfile:1.7

FROM maven:3.9.11-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml ./
RUN mvn --batch-mode --no-transfer-progress dependency:go-offline

COPY src ./src
RUN mvn --batch-mode --no-transfer-progress package -DskipTests && \
    cp target/stockflow-backend-*.jar /workspace/app.jar

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S -g 10001 stockflow && \
    adduser -S -D -H -u 10001 -G stockflow stockflow

WORKDIR /app

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0"

COPY --from=build --chown=10001:10001 /workspace/app.jar ./app.jar

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=6 \
    CMD wget --quiet --spider "http://127.0.0.1:${PORT:-8080}/api/v1/health/readiness" || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
