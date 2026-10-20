
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -B -Dmaven.test.skip=true clean package

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --create-home --uid 10001 appuser
COPY --from=build /workspace/target/olivepress-backend-1.0.0.jar /app/app.jar
RUN chown -R appuser:appuser /app

USER appuser
ENV PORT=8091
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8091

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
