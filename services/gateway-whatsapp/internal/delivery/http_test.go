package delivery

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetWebhook_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := &HTTPHandler{}
	router.GET("/wa/webhook", handler.GetWebhook)

	os.Setenv("WA_VERIFY_TOKEN", "test_verify_token")
	defer os.Unsetenv("WA_VERIFY_TOKEN")

	req, _ := http.NewRequest("GET", "/wa/webhook?hub.verify_token=test_verify_token&hub.challenge=test_challenge_id", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Errorf("Expected status OK, got %d", resp.Code)
	}

	if resp.Body.String() != "test_challenge_id" {
		t.Errorf("Expected body 'test_challenge_id', got '%s'", resp.Body.String())
	}
}

func TestGetWebhook_Mismatch(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := &HTTPHandler{}
	router.GET("/wa/webhook", handler.GetWebhook)

	os.Setenv("WA_VERIFY_TOKEN", "test_verify_token")
	defer os.Unsetenv("WA_VERIFY_TOKEN")

	req, _ := http.NewRequest("GET", "/wa/webhook?hub.verify_token=wrong_token&hub.challenge=test_challenge_id", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusForbidden {
		t.Errorf("Expected status Forbidden, got %d", resp.Code)
	}
}

func TestValidateSignature(t *testing.T) {
	secret := "my_app_secret"
	body := []byte(`{"object":"whatsapp_business_account"}`)
	
	// sha256 HMAC of body using secret:
	// echo -n '{"object":"whatsapp_business_account"}' | openssl dgst -sha256 -hmac 'my_app_secret'
	// => 9915ba8ec6f23ce8d89e5a8fb0cb7a83709d1341c2c2f1f00827299a9b6c00d4
	expectedSig := "sha256=031229137e6e501e64fd10b6a74f06e9c4fc7e22654da45de78cf2299122487a"

	if !validateSignature(body, secret, expectedSig) {
		t.Errorf("Expected signature validation to succeed")
	}

	if validateSignature(body, secret, "sha256=wrong") {
		t.Errorf("Expected signature validation to fail for wrong signature")
	}

	if validateSignature(body, "wrong_secret", expectedSig) {
		t.Errorf("Expected signature validation to fail for wrong secret")
	}
}
