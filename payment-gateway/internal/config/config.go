package config

import "os"

type Config struct {
	Port             string
	RedisAddr        string
	XenditAPIKey     string
	XenditWebhookKey string
	CoreAPIURL       string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5002"
	}
	
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}
	
	return Config{
		Port:             port,
		RedisAddr:        redisAddr,
		XenditAPIKey:     os.Getenv("XENDIT_API_KEY"),
		XenditWebhookKey: os.Getenv("XENDIT_WEBHOOK_KEY"),
		CoreAPIURL:       os.Getenv("CORE_API_URL"),
	}
}
