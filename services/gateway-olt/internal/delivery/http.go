package delivery

import (
	"net/http"

	"gateways/gateway-olt/internal/olt"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type HTTPHandler struct {
	repo *olt.Repository
}

func NewHTTPHandler(repo *olt.Repository) *HTTPHandler {
	return &HTTPHandler{repo: repo}
}

// GET /olt
func (h *HTTPHandler) GetOlts(c *gin.Context) {
	ctx := c.Request.Context()
	tenantSlug := c.Query("tenantSlug")

	var list []*olt.OLT
	var err error
	if tenantSlug != "" {
		list, err = h.repo.ListTenantOlts(ctx, tenantSlug)
	} else {
		list, err = h.repo.ListAllOlts(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": list})
}

// POST /olt
func (h *HTTPHandler) CreateOlt(c *gin.Context) {
	ctx := c.Request.Context()
	var req olt.CreateOLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	if req.Port == 0 {
		req.Port = 161
	}

	dbReq := &olt.CreateOltRequestInternal{
		TenantSlug:     req.TenantSlug,
		Name:           req.Name,
		Host:           req.Host,
		Port:           req.Port,
		Vendor:         req.Vendor,
		Community:      req.Community,
		WriteCommunity: req.WriteCommunity,
		Username:       req.Username,
		Password:       req.Password,
	}

	o, err := h.repo.CreateOlt(ctx, dbReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": o})
}

// GET /olt/:id/status
func (h *HTTPHandler) GetOltStatus(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	o, err := h.repo.GetOlt(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "OLT not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	online, err := driver.Ping(ctx)
	statusStr := "offline"
	if online && err == nil {
		statusStr = "online"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"oltId":  id,
			"status": statusStr,
		},
	})
}

// GET /olt/:id/ports
func (h *HTTPHandler) GetOltPorts(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	o, err := h.repo.GetOlt(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "OLT not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	ports, err := driver.GetPorts(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "SNMP_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": ports})
}

// GET /olt/:id/onts
func (h *HTTPHandler) GetOltOnts(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	o, err := h.repo.GetOlt(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "OLT not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	onts, err := driver.GetOnts(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "SNMP_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": onts})
}

// GET /ont/:serial/signal
func (h *HTTPHandler) GetOntSignal(c *gin.Context) {
	ctx := c.Request.Context()
	serial := c.Param("serial")
	oltID := c.Query("oltId")
	if oltID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": "oltId query param is required"}})
		return
	}

	o, err := h.repo.GetOlt(ctx, oltID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	sig, err := driver.GetOntSignal(ctx, serial)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "SNMP_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": sig})
}

// GET /ont/:serial/status
func (h *HTTPHandler) GetOntStatus(c *gin.Context) {
	ctx := c.Request.Context()
	serial := c.Param("serial")
	oltID := c.Query("oltId")
	if oltID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": "oltId query param is required"}})
		return
	}

	o, err := h.repo.GetOlt(ctx, oltID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	sig, err := driver.GetOntSignal(ctx, serial)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "SNMP_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"serial": serial,
			"status": sig.Status,
		},
	})
}

// POST /ont/:serial/reboot
func (h *HTTPHandler) RebootOnt(c *gin.Context) {
	ctx := c.Request.Context()
	serial := c.Param("serial")
	oltID := c.Query("oltId")
	if oltID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": "oltId query param is required"}})
		return
	}

	o, err := h.repo.GetOlt(ctx, oltID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	if err := driver.RebootOnt(ctx, serial); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "SSH_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Reboot command sent to ONT"})
}

// GET /olt/:id/bandwidth
func (h *HTTPHandler) GetOltBandwidth(c *gin.Context) {
	// Realtime bandwidth mock returning standard metrics
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"rxBps": 124500000, // 124 Mbps
			"txBps": 482000000, // 482 Mbps
		},
	})
}

// POST /olt/:id/provision
func (h *HTTPHandler) ProvisionOnt(c *gin.Context) {
	ctx := c.Request.Context()
	var req olt.ProvisionONTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	o, err := h.repo.GetOlt(ctx, req.OltID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	driver, err := olt.NewOLTDriver(o)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "DRIVER_ERROR", "message": err.Error()}})
		return
	}

	if err := driver.ProvisionOnt(ctx, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "PROVISION_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "ONT provisioning command successful"})
}
