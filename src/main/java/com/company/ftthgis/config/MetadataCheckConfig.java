package com.company.ftthgis.config;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Configuration
@Slf4j
@Profile("debug")
public class MetadataCheckConfig {

    @PersistenceContext
    private EntityManager entityManager;

    @PostConstruct
    @SuppressWarnings("unchecked")
    public void checkMetadata() {
        log.info("Checking database geometry metadata...");
        try {
            String sql = "SELECT column_name, udt_name, data_type " +
                    "FROM information_schema.columns " +
                    "WHERE table_name = 'network_edges' AND column_name IN ('geom', 'geometry_simple')";

            List<Object[]> results = (List<Object[]>) entityManager.createNativeQuery(sql).getResultList();
            for (Object[] row : results) {
                log.info("Column: {}, UDT: {}, DataType: {}", row[0], row[1], row[2]);
            }

            String sql2 = "SELECT f_table_name, f_geometry_column, srid, type, coord_dimension " +
                    "FROM geometry_columns " +
                    "WHERE f_table_name = 'network_edges'";
            List<Object[]> results2 = (List<Object[]>) entityManager.createNativeQuery(sql2).getResultList();
            for (Object[] row : results2) {
                log.info("Table: {}, Col: {}, SRID: {}, Type: {}, Dim: {}", row[0], row[1], row[2], row[3], row[4]);
            }
        } catch (Exception e) {
            log.error("Failed to check metadata", e);
        }
    }
}
