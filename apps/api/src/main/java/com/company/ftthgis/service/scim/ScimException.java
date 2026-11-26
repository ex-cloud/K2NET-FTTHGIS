package com.company.ftthgis.service.scim;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ScimException extends RuntimeException {

    private final HttpStatus status;
    private final String scimType;

    public ScimException(HttpStatus status, String scimType, String detail) {
        super(detail);
        this.status = status;
        this.scimType = scimType;
    }

    public ScimException(HttpStatus status, String detail) {
        this(status, null, detail);
    }
}
