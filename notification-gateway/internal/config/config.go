package config

import (
	"os"
)

type Config struct {
	Port            string
	RedisAddr       string
	TwilioSID       string
	TwilioAuthToken string
	TwilioFrom      string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5001"
	}
	
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}
	
	twilioSID := os.Getenv("TWILIO_ACCOUNT_SID")
	twilioAuthToken := os.Getenv("TWILIO_AUTH_TOKEN")
	twilioFrom := os.Getenv("TWILIO_FROM_NUMBER")
	
	return Config{
		Port:            port,
		RedisAddr:       redisAddr,
		TwilioSID:       twilioSID,
		TwilioAuthToken: twilioAuthToken,
		TwilioFrom:      twilioFrom,
	}
}
