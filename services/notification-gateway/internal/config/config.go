package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port            string
	RedisAddr       string
	TwilioSID       string
	TwilioAuthToken string
	TwilioFrom      string
	SMTPHost        string
	SMTPPort        int
	SMTPUser        string
	SMTPPassword    string
	SMTPFrom        string
	SMTPSecure      bool
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
	
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpPort := 465
	if p, err := strconv.Atoi(smtpPortStr); err == nil && p > 0 {
		smtpPort = p
	}
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	smtpFrom := os.Getenv("SMTP_FROM")
	if smtpFrom == "" {
		smtpFrom = "K2NET Cloud Security <notify@kdua.net>"
	}
	smtpSecure := os.Getenv("SMTP_SECURE") == "true" || smtpPort == 465

	return Config{
		Port:            port,
		RedisAddr:       redisAddr,
		TwilioSID:       twilioSID,
		TwilioAuthToken: twilioAuthToken,
		TwilioFrom:      twilioFrom,
		SMTPHost:        smtpHost,
		SMTPPort:        smtpPort,
		SMTPUser:        smtpUser,
		SMTPPassword:    smtpPassword,
		SMTPFrom:        smtpFrom,
		SMTPSecure:      smtpSecure,
	}
}
