package com.company.ftthgis.config.gis;

import org.n52.jackson.datatype.jts.JtsModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PostgisConfig {
    
    @Bean
    public JtsModule jtsModule() {
        // This module is needed for Jackson to serialize/deserialize JTS geometries
        return new JtsModule();
    }
}
