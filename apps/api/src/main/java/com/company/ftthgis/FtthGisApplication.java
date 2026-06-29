package com.company.ftthgis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application entry point.
 *
 * <p>We explicitly declare both @EnableJpaRepositories and @EnableRedisRepositories
 * because Spring Data cannot automatically determine store assignment when both
 * Spring Data JPA and Spring Data Redis are on the classpath at the same time.
 *
 * <p>All our repositories live under 'com.company.ftthgis.domain.**.repository'
 * and should be JPA repositories. Redis is used ONLY for caching (via
 * @EnableCaching / RedissonRegionFactory), NOT as a data store.
 *
 * <p>Setting basePackages = {} on @EnableRedisRepositories effectively disables
 * Redis repository scanning without removing the Redis infrastructure beans.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableCaching
@EnableJpaRepositories(basePackages = "com.company.ftthgis")
@EnableRedisRepositories(basePackages = {})
public class FtthGisApplication {

	public static void main(String[] args) {
		SpringApplication.run(FtthGisApplication.class, args);
	}

}
