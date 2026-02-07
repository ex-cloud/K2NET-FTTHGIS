package com.company.ftthgis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FtthGisApplication {

	public static void main(String[] args) {
		SpringApplication.run(FtthGisApplication.class, args);
	}

}
