package config

import "os"

type Config struct {
	Port         string
	RedisAddr    string
	GoogleMapKey string
	HereMapKey   string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5003"
	}
	
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}
	
	return Config{
		Port:         port,
		RedisAddr:    redisAddr,
		GoogleMapKey: os.Getenv("GOOGLE_MAPS_API_KEY"),
		HereMapKey:   os.Getenv("HERE_MAPS_API_KEY"),
	}
}
