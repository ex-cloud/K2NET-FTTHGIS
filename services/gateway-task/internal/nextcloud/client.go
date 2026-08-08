package nextcloud

import (
	"fmt"
	"strings"
	"github.com/studio-b12/gowebdav"
)

type Client struct {
	webdavClient *gowebdav.Client
}

func NewClient(url, user, password string) *Client {
	// Nextcloud WebDAV URL standard suffix correction
	if !strings.HasSuffix(url, "/") {
		url += "/"
	}
	return &Client{
		webdavClient: gowebdav.NewClient(url, user, password),
	}
}

// UploadFile writes a file to Nextcloud, automatically ensuring parent directories exist.
func (c *Client) UploadFile(path string, content []byte) error {
	// Create parent directories sequentially (e.g. "K2NET_Engineering_Vault/01_Projects")
	parts := strings.Split(path, "/")
	currentPath := ""
	for i := 0; i < len(parts)-1; i++ {
		if parts[i] == "" {
			continue
		}
		if currentPath == "" {
			currentPath = parts[i]
		} else {
			currentPath = currentPath + "/" + parts[i]
		}
		// Try to create parent folder. Ignore any error (e.g. 405 Method Not Allowed or 409 Conflict if directory already exists)
		_ = c.webdavClient.Mkdir(currentPath, 0755)
	}

	// Write file content to target path
	err := c.webdavClient.Write(path, content, 0644)
	if err != nil {
		return fmt.Errorf("webdav write error for path %s: %w", path, err)
	}
	return nil
}
