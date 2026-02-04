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
    private Security security = new Security();

    @Getter
    @Setter
    public static class Security {
        private Cors cors = new Cors();

        @Getter
        @Setter
        public static class Cors {
            private String allowedOrigins;
            private String allowedMethods;
            private String allowedHeaders;
        }
    }
}
