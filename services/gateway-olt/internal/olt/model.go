package olt

import "time"

type OLT struct {
	ID             string    `json:"id" db:"id"`
	TenantSlug     string    `json:"tenantSlug" db:"tenant_slug"`
	Name           string    `json:"name" db:"name"`
	Host           string    `json:"host" db:"host"`
	Port           int       `json:"port" db:"port"`
	Vendor         string    `json:"vendor" db:"vendor"` // zte, huawei, fiberhome
	Community      string    `json:"community" db:"community"`
	WriteCommunity string    `json:"writeCommunity,omitempty" db:"write_community"`
	Username       string    `json:"username,omitempty" db:"username"`
	Password       string    `json:"password,omitempty" db:"password"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" db:"updated_at"`
}

type CreateOLTRequest struct {
	TenantSlug     string `json:"tenantSlug" binding:"required"`
	Name           string `json:"name" binding:"required"`
	Host           string `json:"host" binding:"required"`
	Port           int    `json:"port"`
	Vendor         string `json:"vendor" binding:"required"` // zte, huawei, fiberhome
	Community      string `json:"community" binding:"required"`
	WriteCommunity string `json:"writeCommunity"`
	Username       string `json:"username"`
	Password       string `json:"password"`
}

type PortStatus struct {
	PortID     string `json:"portId"`
	PortName   string `json:"portName"`
	Status     string `json:"status"` // up, down
	ActiveONTs int    `json:"activeOnts"`
}

type ONT struct {
	Index        string `json:"index"` // e.g. "1/1/1:1"
	Serial       string `json:"serial"`
	Status       string `json:"status"` // online, offline, LOS
	SignalRx     float64 `json:"signalRx"` // dBm
	SignalTx     float64 `json:"signalTx"` // dBm
	DistanceMeter float64 `json:"distanceMeter"`
	Description  string `json:"description"`
}

type ONTSignal struct {
	Serial       string    `json:"serial"`
	Status       string    `json:"status"`
	SignalRx     float64   `json:"signalRx"`
	SignalTx     float64   `json:"signalTx"`
	DistanceMeter float64  `json:"distanceMeter"`
	Timestamp    time.Time `json:"timestamp"`
}

type ProvisionONTRequest struct {
	OltID      string `json:"oltId" binding:"required"`
	PONPort    string `json:"ponPort" binding:"required"` // e.g., "1/1/1"
	ONTIndex   string `json:"ontIndex" binding:"required"` // e.g., "1"
	Serial     string `json:"serial" binding:"required"`
	Profile    string `json:"profile" binding:"required"`
	VlanID     int    `json:"vlanId" binding:"required"`
	Subscriber string `json:"subscriber" binding:"required"`
}
