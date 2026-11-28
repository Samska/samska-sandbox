# Backend image for the hosted demo (Compose and Railway; the port follows $PORT, default 8080). Build from the repository root: docker build -f backend/Dockerfile backend
FROM eclipse-temurin:25-jdk AS build
WORKDIR /build
# The Maven wrapper unpacks its distribution with unzip; without it the wrapper falls back to another archive
# and fails its checksum check ("Failed to validate Maven distribution SHA-256").
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:25-jre
RUN useradd --system --uid 10001 --no-create-home samska
WORKDIR /app
COPY --from=build /build/app.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
