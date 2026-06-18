package com.company.ftthgis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.security.PrivateKey;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class GithubIntegrationServiceTest {

    @Test
    void parsePrivateKey_acceptsPkcs1Pem() throws Exception {
        GithubIntegrationService service = new GithubIntegrationService(null, new ObjectMapper());

        String pem = "-----BEGIN RSA PRIVATE KEY-----\n" +
                "MIIBOwIBAAJBAM/Qs4NalIwhbRuxYFKOzZ4ePcWXoLVfwJ5KQjBbHuWucTBMvwcu\n" +
                "AEc4VXa2Hi76DiBARvIW75fzNSSjZ0P4DeECAwEAAQJBALR+hrvKe4SuL47C428x\n" +
                "GsN/bpVkma+OZ8TTqGNJcS94XtmC6bb8bWQsH8aIpfhjaPWoq+VOogVAQVFMA8Vx\n" +
                "MPUCIQD13DHbYNhcTfRauG9sMWLe762hze7H9b3O2zipdXQ08wIhANhi04gRgiZz\n" +
                "i3HBsmJ9IeJtP+8sjkSpJ+sJLsbG7rbbAiBslw7mSEYHrt6oWyHLdZynvtC/0IcQ\n" +
                "hneJL8Y9AoWLBQIhAIM2CgbsdvtR/TCRv9WxAycGEEq7vdksqaQAAXlPj9kZAiBn\n" +
                "sTXFQy/T2euv13eQCLGvvuY+Es0F3ga22YZtnQcGrg==\n" +
                "-----END RSA PRIVATE KEY-----";

        Method method = GithubIntegrationService.class.getDeclaredMethod("parsePrivateKey", String.class);
        method.setAccessible(true);

        PrivateKey key = (PrivateKey) method.invoke(service, pem);

        assertNotNull(key);
    }
}
