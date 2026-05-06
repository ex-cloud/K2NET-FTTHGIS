package com.company.ftthgis.config.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LdapConfig {
    private String url;
    private String bindDn;
    private String bindPassword;
    private String userDn;
    private String userFilter;
}
