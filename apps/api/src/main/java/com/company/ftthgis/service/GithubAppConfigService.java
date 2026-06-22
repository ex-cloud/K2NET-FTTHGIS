package com.company.ftthgis.service;

import com.company.ftthgis.domain.common.GithubAppConfig;
import com.company.ftthgis.domain.common.repository.GithubAppConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GithubAppConfigService {

    private final GithubAppConfigRepository githubAppConfigRepository;

    public List<GithubAppConfig> getAllConfigs() {
        return githubAppConfigRepository.findAll();
    }

    public Optional<GithubAppConfig> getConfig(String key) {
        return githubAppConfigRepository.findByKey(key);
    }

    @Transactional
    public GithubAppConfig updateConfig(String key, String value, String category, String description) {
        GithubAppConfig config = githubAppConfigRepository.findByKey(key)
                .orElse(GithubAppConfig.builder()
                        .key(key)
                        .category(category)
                        .description(description)
                        .build());
        config.setValue(value);
        config.setCategory(category);
        config.setDescription(description);
        return githubAppConfigRepository.save(config);
    }
}
