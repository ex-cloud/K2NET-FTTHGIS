package com.company.ftthgis.api.exception;

import lombok.Getter;

/**
 * Thrown by {@code SudoModeAspect} when a high-risk administrative or personal
 * security mutation is attempted without an active cryptographic Sudo elevation.
 */
@Getter
public class SudoRequiredException extends RuntimeException {

    private final String action;
    private final boolean breakGlassSession;

    public SudoRequiredException(String action, boolean breakGlassSession, String message) {
        super(message);
        this.action = action;
        this.breakGlassSession = breakGlassSession;
    }
}
