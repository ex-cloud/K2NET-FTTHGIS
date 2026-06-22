package config

import "os"

type Config struct {
	Port         string
	AWSRegion    string
	AWSEndpoint  string
	AWSAccessKey string
	AWSSecretKey string
	BucketName   string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5004"
	}
	
	return Config{
		Port:         port,
		AWSRegion:    os.Getenv("AWS_REGION"),
		AWSEndpoint:  os.Getenv("AWS_ENDPOINT"),
		AWSAccessKey: os.Getenv("AWS_ACCESS_KEY_ID"),
		AWSSecretKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		BucketName:   os.Getenv("AWS_BUCKET_NAME"),
	}
}
