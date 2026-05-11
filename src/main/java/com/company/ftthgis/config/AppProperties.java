package com.company.ftthgis.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {
    private String frontendUrl;
    private Security security = new Security();
    private Seeder seeder = new Seeder();

    @Getter
    @Setter
    public static class Security {
        private Cors cors = new Cors();
        private Keycloak keycloak = new Keycloak();

        @Getter
        @Setter
        public static class Keycloak {
            private String provisionClientId;
            private String provisionClientSecret;
        }

        @Getter
        @Setter
        public static class Cors {
            private String allowedOrigins;
            private String allowedMethods;
            private String allowedHeaders;
        }
    }

    @Getter
    @Setter
    public static class Seeder {
        private boolean enabled;
    }
}
