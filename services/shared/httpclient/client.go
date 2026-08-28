package httpclient

import (
	"net"
	"net/http"
	"time"
)

// DefaultTransport is an optimized HTTP transport with robust connection pooling.
// Reuses TCP sockets, limits idle connections per host, and prevents socket exhaustion.
var DefaultTransport = &http.Transport{
	Proxy: http.ProxyFromEnvironment,
	DialContext: (&net.Dialer{
		Timeout:   5 * time.Second,
		KeepAlive: 30 * time.Second,
	}).DialContext,
	ForceAttemptHTTP2:     true,
	MaxIdleConns:          100,
	MaxIdleConnsPerHost:   20,
	MaxConnsPerHost:       50,
	IdleConnTimeout:       90 * time.Second,
	TLSHandshakeTimeout:   5 * time.Second,
	ExpectContinueTimeout: 1 * time.Second,
	ResponseHeaderTimeout: 10 * time.Second,
}

// Client is a pooled, production-grade HTTP client with 10-second default timeout.
var Client = &http.Client{
	Transport: DefaultTransport,
	Timeout:   10 * time.Second,
}

// NewClient returns a new http.Client sharing the optimized DefaultTransport with a custom timeout.
func NewClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Transport: DefaultTransport,
		Timeout:   timeout,
	}
}
