package com.company.ftthgis.config.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declares that invoking the annotated controller method requires an active
 * server-verified Sudo Mode elevation window (or a non-Break-Glass fresh-login
 * grace window within 15 minutes).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireSudoMode {

    /**
     * Machine-readable action identifier surfaced in 403 SUDO_REQUIRED payloads.
     */
    String action() default "sensitive_operation";
}
