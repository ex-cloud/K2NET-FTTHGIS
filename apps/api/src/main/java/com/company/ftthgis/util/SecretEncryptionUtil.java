package com.company.ftthgis.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * SecretEncryptionUtil — Enterprise-grade cryptographic utilities for Webhook HMAC secrets,
 * API key hashing (SHA-256), and AES-256-GCM encryption at rest.
 */
@Slf4j
@Component
public class SecretEncryptionUtil {

    private static final String AES_GCM_NO_PADDING = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits standard for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bit authentication tag

    private static final String DEFAULT_INSECURE_KEY = "ftth-gis-master-secret-key-32b!!";

    private final byte[] keyBytes;
    private final SecureRandom secureRandom = new SecureRandom();

    public SecretEncryptionUtil(String rawKey) {
        this(rawKey, "test");
    }

    @Autowired
    public SecretEncryptionUtil(
            @Value("${app.security.encryption-key:ftth-gis-master-secret-key-32b!!}") String rawKey,
            @Value("${spring.profiles.active:default}") String activeProfiles
    ) {
        boolean isProduction = activeProfiles.toLowerCase().contains("prod");

        if (isProduction && (rawKey == null || rawKey.equals(DEFAULT_INSECURE_KEY) || rawKey.trim().length() < 32)) {
            log.error("CRITICAL SECURITY ERROR: Production deployment detected with default or insecure encryption key!");
            throw new IllegalStateException("FATAL: app.security.encryption-key must be explicitly configured with at least 32 characters (256-bit entropy) in production mode.");
        }

        if (rawKey.equals(DEFAULT_INSECURE_KEY)) {
            log.warn("⚠️ SECURITY WARNING: Using default development encryption key. Do NOT use in production!");
        }

        // Ensure 256-bit key via SHA-256
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            this.keyBytes = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Encrypts plaintext using AES-256-GCM with a random 12-byte IV.
     * Output format: Base64(IV + CiphertextAndTag)
     */
    public String encrypt(String plainText) {
        if (plainText == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
            SecretKey secretKey = new SecretKeySpec(keyBytes, "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Encryption failed: {}", e.getMessage());
            throw new RuntimeException("Gagal mengenkripsi secret: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypts AES-256-GCM ciphertext (Base64).
     */
    public String decrypt(String cipherTextBase64) {
        if (cipherTextBase64 == null) return null;
        try {
            byte[] cipherMessage = Base64.getDecoder().decode(cipherTextBase64);

            if (cipherMessage.length < GCM_IV_LENGTH) {
                throw new IllegalArgumentException("Payload enkripsi tidak valid (terlalu pendek).");
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(cipherMessage);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
            SecretKey secretKey = new SecretKeySpec(keyBytes, "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Decryption failed: {}", e.getMessage());
            throw new RuntimeException("Gagal mendekripsi secret: " + e.getMessage(), e);
        }
    }

    /**
     * Computes SHA-256 hash formatted as a hex string.
     */
    public String sha256Hex(String input) {
        if (input == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * Calculates HMAC-SHA256 signature for webhook payload verification.
     * Returns: sha256=<hex_digest>
     */
    public String computeHmacSha256(String secret, String data) {
        if (secret == null || data == null) return "";
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + HexFormat.of().formatHex(rawHmac);
        } catch (Exception e) {
            log.error("HMAC computation failed: {}", e.getMessage());
            throw new RuntimeException("Gagal menghitung HMAC signature: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a secure random 32-character hex token.
     */
    public String generateSecureToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
