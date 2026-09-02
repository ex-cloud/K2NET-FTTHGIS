package config

import (
	"os"
)

type Config struct {
	Port              string
	RedisAddr         string
	GatewayToken      string
	WaApiUrl          string
	WaAccessToken     string
	WaVerifyToken     string
	WaPhoneNumberId   string
	SpringCallbackUrl string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5005"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")

	waApiUrl := os.Getenv("WA_API_URL")
	if waApiUrl == "" {
		waApiUrl = "https://graph.facebook.com/v19.0"
	}

	waAccessToken := os.Getenv("WA_ACCESS_TOKEN")
	waVerifyToken := os.Getenv("WA_VERIFY_TOKEN")
	waPhoneNumberId := os.Getenv("WA_PHONE_NUMBER_ID")

	springCallbackUrl := os.Getenv("SPRING_CALLBACK_URL")
	if springCallbackUrl == "" {
		springCallbackUrl = "http://backend:9090"
	}

	return Config{
		Port:              port,
		RedisAddr:         redisAddr,
		GatewayToken:      gatewayToken,
		WaApiUrl:          waApiUrl,
		WaAccessToken:     waAccessToken,
		WaVerifyToken:     waVerifyToken,
		WaPhoneNumberId:   waPhoneNumberId,
		SpringCallbackUrl: springCallbackUrl,
	}
}
