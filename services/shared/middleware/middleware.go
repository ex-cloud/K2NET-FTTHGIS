package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"

	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var expectedToken string

func InitAuthToken() {
	expectedToken = os.Getenv("GATEWAY_TOKEN")
	if expectedToken == "" {
		if os.Getenv("GO_ENV") == "production" {
			logger.Log.Fatal("GATEWAY_TOKEN must be set in production mode")
		}
		
		bytes := make([]byte, 16)
		if _, err := rand.Read(bytes); err != nil {
			panic("Failed to generate random token: " + err.Error())
		}
		expectedToken = hex.EncodeToString(bytes)
		logger.Log.Warn("GATEWAY_TOKEN env not set. Generated ephemeral token for development!", zap.String("token", expectedToken))
	}
}

// CorrelationIDMiddleware extracts or generates a Correlation ID
func CorrelationIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		correlationID := c.GetHeader("X-Correlation-ID")
		if correlationID == "" {
			bytes := make([]byte, 16)
			if _, err := rand.Read(bytes); err == nil {
				correlationID = hex.EncodeToString(bytes)
			} else {
				correlationID = "unknown-correlation-id"
			}
		}
		
		c.Header("X-Correlation-ID", correlationID)
		c.Set("correlation_id", correlationID)
		
		ctx := context.WithValue(c.Request.Context(), "correlation_id", correlationID)
		c.Request = c.Request.WithContext(ctx)
		
		c.Next()
	}
}

// InternalAuthMiddleware verifies the static X-Gateway-Token
func InternalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Gateway-Token")
		if token == "" || token != expectedToken {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized internal gateway communication",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
