package config

import (
	"os"
)

type Config struct {
	Port            string
	PrometheusUrl   string
	PollerUrl       string
	BackendUrl      string
	KongAdminUrl    string
	NotificationUrl string
	MapGatewayUrl   string
	StorageGatewayUrl string
	GatewayToken    string
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

	kongAdminUrl := os.Getenv("KONG_ADMIN_URL")
	if kongAdminUrl == "" {
		kongAdminUrl = "http://kong:8001"
	}

	notificationUrl := os.Getenv("NOTIFICATION_GATEWAY_URL")
	if notificationUrl == "" {
		notificationUrl = "http://ftth-notification-gateway:5001"
	}

	mapGatewayUrl := os.Getenv("MAP_GATEWAY_URL")
	if mapGatewayUrl == "" {
		mapGatewayUrl = "http://ftth-map-gateway:5003"
	}

	storageGatewayUrl := os.Getenv("STORAGE_GATEWAY_URL")
	if storageGatewayUrl == "" {
		storageGatewayUrl = "http://ftth-storage-gateway:5004"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")

	return &Config{
		Port:              port,
		PrometheusUrl:     prometheusUrl,
		PollerUrl:         pollerUrl,
		BackendUrl:        backendUrl,
		KongAdminUrl:      kongAdminUrl,
		NotificationUrl:   notificationUrl,
		MapGatewayUrl:     mapGatewayUrl,
		StorageGatewayUrl: storageGatewayUrl,
		GatewayToken:      gatewayToken,
	}
}
