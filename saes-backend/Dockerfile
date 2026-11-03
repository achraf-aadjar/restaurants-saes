# Image du backend. Les tests ne sont pas relances ici : ils tournent dans la
# CI (ils demarrent eux-memes une PostgreSQL avec Testcontainers).

FROM eclipse-temurin:21-jdk AS construction
WORKDIR /construction
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package && cp target/saes-backend-*.jar application.jar

FROM eclipse-temurin:21-jre
RUN groupadd --system saes && useradd --system --gid saes --no-create-home saes
WORKDIR /app
COPY --from=construction /construction/application.jar application.jar
USER saes
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/application.jar"]
