package audit

import (
	"fmt"
	"sync"
	"time"
)

type dedupEntry struct {
	firstSeen   time.Time
	lastSeen    time.Time
	count       int
	sampleLimit int
}

type SlidingWindowDeduplicator struct {
	mu           sync.Mutex
	window       time.Duration
	threshold    int
	entries      map[string]*dedupEntry
	cleanupTimer *time.Ticker
}

func NewSlidingWindowDeduplicator(window time.Duration, threshold int) *SlidingWindowDeduplicator {
	d := &SlidingWindowDeduplicator{
		window:    window,
		threshold: threshold,
		entries:   make(map[string]*dedupEntry),
	}
	go d.startCleanupLoop()
	return d
}

func (d *SlidingWindowDeduplicator) ShouldSample(tenantSlug, action, resourceType, serviceSource, resourceID string) (shouldRecord bool, repeatCount int) {
	d.mu.Lock()
	defer d.mu.Unlock()

	key := fmt.Sprintf("%s|%s|%s|%s|%s", tenantSlug, action, resourceType, serviceSource, resourceID)
	now := time.Now()

	entry, exists := d.entries[key]
	if !exists || now.Sub(entry.firstSeen) > d.window {
		// New window
		d.entries[key] = &dedupEntry{
			firstSeen: now,
			lastSeen:  now,
			count:     1,
		}
		return true, 1
	}

	entry.count++
	entry.lastSeen = now

	// If below threshold, record normally
	if entry.count <= d.threshold {
		return true, entry.count
	}

	// Above threshold: sample only periodic milestones (e.g. every 50th repeat or end of window)
	if entry.count%d.threshold == 0 {
		return true, entry.count
	}

	return false, entry.count
}

func (d *SlidingWindowDeduplicator) startCleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		d.mu.Lock()
		now := time.Now()
		for k, v := range d.entries {
			if now.Sub(v.lastSeen) > 2*d.window {
				delete(d.entries, k)
			}
		}
		d.mu.Unlock()
	}
}
