package com.company.ftthgis.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityMetadataService {

    private final ApplicationContext applicationContext;
    private final Map<String, List<EndpointUsageDto>> permissionUsageIndex = new ConcurrentHashMap<>();
    private final List<EndpointUsageDto> allSecuredEndpoints = new ArrayList<>();

    private static final Pattern PERMISSION_CODE_PATTERN = Pattern.compile(
        "(?:hasAuthority|hasEffectivePermission|hasRole)\\(['\"]([^'\"]+)['\"]\\)"
    );

    @PostConstruct
    public void scanAndIndexSecurityEndpoints() {
        try {
            RequestMappingHandlerMapping mapping = applicationContext.getBean(RequestMappingHandlerMapping.class);
            Map<RequestMappingInfo, HandlerMethod> handlerMethods = mapping.getHandlerMethods();

            permissionUsageIndex.clear();
            allSecuredEndpoints.clear();

            for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
                RequestMappingInfo info = entry.getKey();
                HandlerMethod handlerMethod = entry.getValue();

                Class<?> beanType = handlerMethod.getBeanType();
                Method method = handlerMethod.getMethod();

                // Only scan our application controllers
                if (!beanType.getPackageName().startsWith("com.company.ftthgis")) {
                    continue;
                }

                PreAuthorize methodAuth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
                PreAuthorize classAuth = AnnotationUtils.findAnnotation(beanType, PreAuthorize.class);
                PreAuthorize effectiveAuth = (methodAuth != null) ? methodAuth : classAuth;

                String authExpression = (effectiveAuth != null) ? effectiveAuth.value().trim() : "UNPROTECTED";

                // Extract HTTP methods
                Set<String> httpMethods = new HashSet<>();
                for (var httpMethod : info.getMethodsCondition().getMethods()) {
                    httpMethods.add(httpMethod.name());
                }
                String httpMethodStr = httpMethods.isEmpty() ? "ANY" : String.join(", ", httpMethods);

                // Extract Path patterns
                Set<String> patterns = new HashSet<>();
                if (info.getPathPatternsCondition() != null) {
                    for (var pattern : info.getPathPatternsCondition().getPatterns()) {
                        patterns.add(pattern.getPatternString());
                    }
                } else if (info.getPatternsCondition() != null) {
                    patterns.addAll(info.getPatternsCondition().getPatterns());
                }
                String pathStr = patterns.isEmpty() ? "/" : String.join(", ", patterns);

                EndpointUsageDto usage = new EndpointUsageDto(
                    beanType.getSimpleName(),
                    method.getName(),
                    httpMethodStr,
                    pathStr,
                    authExpression
                );

                allSecuredEndpoints.add(usage);

                // Index permissions referenced in SpEL
                if (effectiveAuth != null) {
                    Matcher matcher = PERMISSION_CODE_PATTERN.matcher(authExpression);
                    while (matcher.find()) {
                        String matchedCode = matcher.group(1);
                        permissionUsageIndex.computeIfAbsent(matchedCode, k -> new ArrayList<>()).add(usage);
                    }
                }
            }

            log.info("🛡️ SecurityMetadataService: Indexed {} endpoints across {} permission/role keys",
                allSecuredEndpoints.size(), permissionUsageIndex.size());
        } catch (Exception e) {
            log.error("Failed to scan security metadata: {}", e.getMessage(), e);
        }
    }

    public List<EndpointUsageDto> getUsagesForPermission(String permissionCode) {
        if (permissionCode == null || permissionCode.trim().isEmpty()) {
            return List.of();
        }
        return permissionUsageIndex.getOrDefault(permissionCode.trim(), List.of());
    }

    public Map<String, List<EndpointUsageDto>> getAllPermissionUsages() {
        return Collections.unmodifiableMap(permissionUsageIndex);
    }

    public record EndpointUsageDto(
        String controller,
        String method,
        String httpMethod,
        String path,
        String authorizationExpression
    ) {}
}
