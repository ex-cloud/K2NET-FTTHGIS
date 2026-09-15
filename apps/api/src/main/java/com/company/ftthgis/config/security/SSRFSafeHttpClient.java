package com.company.ftthgis.config.security;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.net.ssl.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * SSRFSafeHttpClient — Enterprise HTTP Client with Anti-DNS Rebinding (IP Pinning) Defense.
 * 
 * Guarantees that:
 * 1. Pre-flight DNS resolution validates all IP addresses against restricted ranges.
 * 2. The TCP socket connects directly to the pinned, pre-validated IP address (eliminating TOCTOU DNS rebinding).
 * 3. TLS SNI (Server Name Indication) and Host headers are preserved for strict certificate verification.
 * 4. HTTP redirects are strictly disabled (preventing Open Redirect SSRF bypass).
 * 5. Strict connect (3s) and read (5s) timeouts are enforced with response size limits (1MB).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SSRFSafeHttpClient {

    private final WebhookSecurityValidator securityValidator;

    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;
    private static final int MAX_RESPONSE_BYTES = 1024 * 1024; // 1 MB limit

    @Getter
    @Builder
    public static class HttpResponse {
        private final int statusCode;
        private final String body;
        private final int latencyMs;
        private final String resolvedIp;
        private final boolean success;
        private final String errorMessage;
    }

    /**
     * Executes a secure POST request with Anti-DNS Rebinding IP Pinning.
     *
     * @param targetUrl Target HTTPS URL
     * @param payloadJson Request JSON payload
     * @param customHeaders Additional HTTP headers (e.g. X-K2NET-Signature, User-Agent)
     * @return HttpResponse containing status, body, latency, and resolved IP
     */
    public HttpResponse executePost(String targetUrl, String payloadJson, Map<String, String> customHeaders) {
        long startTime = System.currentTimeMillis();

        if (targetUrl == null || targetUrl.isBlank()) {
            return HttpResponse.builder()
                    .statusCode(0)
                    .success(false)
                    .errorMessage("URL target webhook tidak boleh kosong.")
                    .latencyMs(0)
                    .build();
        }

        try {
            // 1. Pre-flight URL and SSRF validation
            securityValidator.validateUrl(targetUrl);

            URI uri = URI.create(targetUrl.trim());
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 443;

            // 2. Resolve DNS once and validate all IPs
            InetAddress[] addresses = InetAddress.getAllByName(host);
            if (addresses == null || addresses.length == 0) {
                throw new UnknownHostException("Resolusi DNS gagal untuk host: " + host);
            }

            for (InetAddress addr : addresses) {
                if (securityValidator.isRestrictedIp(addr)) {
                    log.warn("SSRF DNS Rebinding Blocked: Host '{}' resolved to restricted IP '{}'", host, addr.getHostAddress());
                    throw new SecurityException("Akses ke IP privat/terlarang (" + addr.getHostAddress() + ") ditolak oleh SSRF Guard.");
                }
            }

            // Pin to first validated IP
            InetAddress pinnedIp = addresses[0];
            log.debug("SSRF Pinning: Host '{}' pinned to IP '{}'", host, pinnedIp.getHostAddress());

            // 3. Open connection using pinned SSL Socket Factory
            URL url = uri.toURL();
            HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false); // Anti-redirect bypass
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(READ_TIMEOUT_MS);
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);

            // Install IP-pinned SSLSocketFactory
            SSLSocketFactory defaultFactory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            conn.setSSLSocketFactory(new PinnedSSLSocketFactory(defaultFactory, pinnedIp, host));

            // Set Headers
            conn.setRequestProperty("Host", host);
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            conn.setRequestProperty("User-Agent", "K2NET-FTTH-Webhook-Engine/2.0");

            if (customHeaders != null) {
                for (Map.Entry<String, String> entry : customHeaders.entrySet()) {
                    if (entry.getKey() != null && entry.getValue() != null) {
                        conn.setRequestProperty(entry.getKey(), entry.getValue());
                    }
                }
            }

            // Write Body
            byte[] bodyBytes = payloadJson != null ? payloadJson.getBytes(StandardCharsets.UTF_8) : new byte[0];
            conn.setFixedLengthStreamingMode(bodyBytes.length);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(bodyBytes);
                os.flush();
            }

            int statusCode = conn.getResponseCode();
            int latencyMs = (int) (System.currentTimeMillis() - startTime);

            // Read Response safely (capped at 1MB)
            InputStream is = (statusCode >= 200 && statusCode < 400) ? conn.getInputStream() : conn.getErrorStream();
            String responseBody = "";
            if (is != null) {
                try (InputStream in = is; ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    int totalRead = 0;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        totalRead += bytesRead;
                        if (totalRead > MAX_RESPONSE_BYTES) {
                            baos.write(buffer, 0, bytesRead);
                            baos.write("... [truncated after 1MB]".getBytes(StandardCharsets.UTF_8));
                            break;
                        }
                        baos.write(buffer, 0, bytesRead);
                    }
                    responseBody = baos.toString(StandardCharsets.UTF_8);
                }
            }

            boolean isSuccess = (statusCode >= 200 && statusCode < 300);
            return HttpResponse.builder()
                    .statusCode(statusCode)
                    .body(responseBody)
                    .latencyMs(latencyMs)
                    .resolvedIp(pinnedIp.getHostAddress())
                    .success(isSuccess)
                    .errorMessage(isSuccess ? null : "HTTP " + statusCode + (responseBody.isBlank() ? "" : ": " + responseBody))
                    .build();

        } catch (Exception e) {
            int latencyMs = (int) (System.currentTimeMillis() - startTime);
            log.warn("Webhook dispatch failed to {}: {}", targetUrl, e.getMessage());
            return HttpResponse.builder()
                    .statusCode(0)
                    .body("")
                    .latencyMs(latencyMs)
                    .success(false)
                    .errorMessage("Koneksi gagal: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Custom SSLSocketFactory that forces connection to a pre-validated IP address
     * while preserving SNI and Host header for TLS certificate validation.
     */
    private static class PinnedSSLSocketFactory extends SSLSocketFactory {

        private final SSLSocketFactory delegate;
        private final InetAddress pinnedAddress;
        private final String originalHost;

        public PinnedSSLSocketFactory(SSLSocketFactory delegate, InetAddress pinnedAddress, String originalHost) {
            this.delegate = delegate;
            this.pinnedAddress = pinnedAddress;
            this.originalHost = originalHost;
        }

        @Override
        public String[] getDefaultCipherSuites() {
            return delegate.getDefaultCipherSuites();
        }

        @Override
        public String[] getSupportedCipherSuites() {
            return delegate.getSupportedCipherSuites();
        }

        @Override
        public Socket createSocket(String host, int port) throws IOException {
            return configureSocket(delegate.createSocket(pinnedAddress, port));
        }

        @Override
        public Socket createSocket(InetAddress host, int port) throws IOException {
            return configureSocket(delegate.createSocket(pinnedAddress, port));
        }

        @Override
        public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
            return configureSocket(delegate.createSocket(pinnedAddress, port, localHost, localPort));
        }

        @Override
        public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort) throws IOException {
            return configureSocket(delegate.createSocket(pinnedAddress, port, localAddress, localPort));
        }

        @Override
        public Socket createSocket(Socket s, String host, int port, boolean autoClose) throws IOException {
            return configureSocket(delegate.createSocket(s, originalHost, port, autoClose));
        }

        private Socket configureSocket(Socket socket) {
            if (socket instanceof SSLSocket sslSocket) {
                SSLParameters sslParameters = sslSocket.getSSLParameters();
                sslParameters.setServerNames(List.of(new SNIHostName(originalHost)));
                sslSocket.setSSLParameters(sslParameters);
            }
            return socket;
        }
    }
}
