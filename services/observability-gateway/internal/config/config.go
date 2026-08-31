package config

import (
	"os"
)

type Config struct {
	Port          string
	PrometheusUrl string
	PollerUrl     string
	BackendUrl    string
	GatewayToken  string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5013"
	}

	prometheusUrl := os.Getenv("PROMETHEUS_URL")
	if prometheusUrl == "" {
		prometheusUrl = "http://ftth-prometheus:9090"
	}

	pollerUrl := os.Getenv("POLLER_URL")
	if pollerUrl == "" {
		pollerUrl = "http://ftth-poller:5010"
	}

	backendUrl := os.Getenv("BACKEND_URL")
	if backendUrl == "" {
		backendUrl = "http://backend:9090"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")
	if gatewayToken == "" {
		gatewayToken = "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN"
	}

	return &Config{
		Port:          port,
		PrometheusUrl: prometheusUrl,
		PollerUrl:     pollerUrl,
		BackendUrl:    backendUrl,
		GatewayToken:  gatewayToken,
	}
}
