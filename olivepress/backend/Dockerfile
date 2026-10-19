# syntax=docker/dockerfile:1

# ============================================================
# OlivePress backend - image de production (multi-etapes)
# Etape 1 : compilation Maven  |  Etape 2 : execution JRE 21
# Le port d'ecoute suit la variable PORT (Render) sinon 8091.
# ============================================================

# ---------- Etape 1 : build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Compilation (tests ignores dans l'image : deja executes en CI)
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -B -Dmaven.test.skip=true \
        -Dmaven.wagon.http.retryHandler.count=6 \
        clean package

# ---------- Etape 2 : runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --create-home --uid 10001 appuser
COPY --from=build /workspace/target/olivepress-backend-1.0.0.jar app.jar
RUN chown -R appuser:appuser /app
USER appuser

# Limite le tas JVM pour les offres gratuites (512 Mo) ; surchargeable via l'environnement.
ENV PORT=8091
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8091
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
