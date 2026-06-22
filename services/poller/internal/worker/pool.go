package worker

import (
	"log"
	"sync"
	"time"

	"ftth-gis-poller/internal/cache"
	"ftth-gis-poller/internal/config"
	"ftth-gis-poller/internal/snmp"
)

// Pool manages a pool of workers that poll devices concurrently
type Pool struct {
	config     *config.Config
	cache      *cache.StatusCache
	jobs       chan config.DeviceConfig
	wg         sync.WaitGroup
	stopChan   chan struct{}
	lastStatus map[string]string // Track last known status for change detection
	mu         sync.Mutex
}

// NewPool creates a new worker pool
func NewPool(cfg *config.Config, statusCache *cache.StatusCache) *Pool {
	return &Pool{
		config:     cfg,
		cache:      statusCache,
		jobs:       make(chan config.DeviceConfig, len(cfg.Devices)),
		stopChan:   make(chan struct{}),
		lastStatus: make(map[string]string),
	}
}

// Start begins the polling loop
func (p *Pool) Start() {
	log.Printf("🚀 Starting worker pool with %d workers", p.config.WorkerCount)

	// Start workers
	for i := 0; i < p.config.WorkerCount; i++ {
		p.wg.Add(1)
		go p.worker(i)
	}

	// Start polling ticker
	go p.pollLoop()
}

// Stop gracefully shuts down the worker pool
func (p *Pool) Stop() {
	log.Println("🛑 Stopping worker pool...")
	close(p.stopChan)
	close(p.jobs)
	p.wg.Wait()
	log.Println("✅ Worker pool stopped")
}

func (p *Pool) pollLoop() {
	// Immediate first poll
	p.enqueueDevices()

	ticker := time.NewTicker(p.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			p.enqueueDevices()
		case <-p.stopChan:
			return
		}
	}
}

func (p *Pool) enqueueDevices() {
	log.Printf("📡 Enqueueing %d devices for polling...", len(p.config.Devices))
	for _, device := range p.config.Devices {
		select {
		case p.jobs <- device:
		case <-p.stopChan:
			return
		}
	}
}

func (p *Pool) worker(id int) {
	defer p.wg.Done()
	log.Printf("👷 Worker %d started", id)

	for device := range p.jobs {
		p.pollDevice(device)
	}

	log.Printf("👷 Worker %d stopped", id)
}

func (p *Pool) pollDevice(device config.DeviceConfig) {
	client := snmp.NewClient(
		device.IP,
		device.Port,
		p.config.SNMPCommunity,
		p.config.SNMPTimeout,
		p.config.SNMPRetries,
	)

	result := client.Poll(device.Code, device.OIDList)

	// Create status for caching
	status := &cache.DeviceStatus{
		Code:      result.DeviceCode,
		Status:    result.Status,
		Metrics:   result.Metrics,
		Timestamp: result.Timestamp,
	}

	// Cache the status
	if err := p.cache.SetStatus(status); err != nil {
		log.Printf("⚠️ Failed to cache status for %s: %v", device.Code, err)
	}

	// Check for status change and publish event
	p.mu.Lock()
	lastStatus, existed := p.lastStatus[device.Code]

	// Publish if: 1) First time seeing this device, OR 2) Status changed
	shouldPublish := !existed || lastStatus != result.Status

	if shouldPublish {
		if !existed {
			log.Printf("🆕 First poll for %s: %s (publishing initial state)", device.Code, result.Status)
		} else {
			log.Printf("🔔 Status changed for %s: %s -> %s", device.Code, lastStatus, result.Status)
		}

		if err := p.cache.PublishStatusChange(status); err != nil {
			log.Printf("⚠️ Failed to publish status change: %v", err)
		}
	}

	p.lastStatus[device.Code] = result.Status
	p.mu.Unlock()
}
