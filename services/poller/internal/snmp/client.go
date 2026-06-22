package snmp

import (
	"fmt"
	"log"
	"time"

	"github.com/gosnmp/gosnmp"
)

// Client wraps gosnmp with additional functionality
type Client struct {
	target    string
	port      uint16
	community string
	timeout   time.Duration
	retries   int
}

// PollResult holds the result of an SNMP poll
type PollResult struct {
	DeviceCode string
	Status     string // UP, DOWN, DEGRADED
	Metrics    map[string]interface{}
	Timestamp  time.Time
	Error      error
}

// NewClient creates a new SNMP client
func NewClient(target string, port uint16, community string, timeout time.Duration, retries int) *Client {
	return &Client{
		target:    target,
		port:      port,
		community: community,
		timeout:   timeout,
		retries:   retries,
	}
}

// Poll performs SNMP Get on the specified OIDs and returns results
func (c *Client) Poll(deviceCode string, oids []string) *PollResult {
	result := &PollResult{
		DeviceCode: deviceCode,
		Metrics:    make(map[string]interface{}),
		Timestamp:  time.Now(),
	}

	params := &gosnmp.GoSNMP{
		Target:    c.target,
		Port:      c.port,
		Community: c.community,
		Version:   gosnmp.Version2c,
		Timeout:   c.timeout,
		Retries:   c.retries,
	}

	err := params.Connect()
	if err != nil {
		result.Status = "DOWN"
		result.Error = fmt.Errorf("connection failed: %w", err)
		log.Printf("[%s] Connection failed: %v", deviceCode, err)
		return result
	}
	defer params.Conn.Close()

	response, err := params.Get(oids)
	if err != nil {
		result.Status = "DOWN"
		result.Error = fmt.Errorf("SNMP Get failed: %w", err)
		log.Printf("[%s] SNMP Get failed: %v", deviceCode, err)
		return result
	}

	// Parse response
	for _, variable := range response.Variables {
		switch variable.Type {
		case gosnmp.OctetString:
			result.Metrics[variable.Name] = string(variable.Value.([]byte))
		case gosnmp.TimeTicks:
			result.Metrics[variable.Name] = variable.Value
		case gosnmp.Integer:
			result.Metrics[variable.Name] = variable.Value
		case gosnmp.Counter32, gosnmp.Counter64:
			result.Metrics[variable.Name] = variable.Value
		default:
			result.Metrics[variable.Name] = fmt.Sprintf("%v", variable.Value)
		}
	}

	result.Status = "UP"
	log.Printf("[%s] Poll successful: %d OIDs retrieved", deviceCode, len(result.Metrics))
	return result
}
