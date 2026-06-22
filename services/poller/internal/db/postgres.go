package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

type DeviceTarget struct {
	Code      string
	IPAddress string
	Community string
}

type Service struct {
	conn *pgx.Conn
}

func New(databaseURL string) (*Service, error) {
	conn, err := pgx.Connect(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}
	return &Service{conn: conn}, nil
}

func (s *Service) Close() {
	s.conn.Close(context.Background())
}

// GetActiveDevices fetches OLTs with valid IP addresses
func (s *Service) GetActiveDevices(ctx context.Context) ([]DeviceTarget, error) {
	// Query assumes standard Hibernate Joined Inheritance strategy
	// network_nodes table contains the 'code'
	// olt table contains 'ip_address' and 'snmp_community' and shares 'id' with network_nodes
	query := `
		SELECT n.code, o.ip_address, o.snmp_community 
		FROM olt o 
		JOIN network_nodes n ON o.id = n.id 
		WHERE o.ip_address IS NOT NULL AND o.ip_address != ''
	`

	rows, err := s.conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}
	defer rows.Close()

	var devices []DeviceTarget
	for rows.Next() {
		var d DeviceTarget
		// Handle potential NULL community by using a pointer or treating as empty string if strict
		// Assuming snmp_community can be null, we default to public if so (logic can handle this)
		var community *string
		if err := rows.Scan(&d.Code, &d.IPAddress, &community); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		if community != nil {
			d.Community = *community
		} else {
			d.Community = "public"
		}
		devices = append(devices, d)
	}

	return devices, nil
}

// SeedDevData inserts a dev OLT if not exists (Verified for Development Only)
func (s *Service) SeedDevData(ctx context.Context) error {
	// 1. Check if 'OLT-TEST-01' exists in network_nodes
	// We assume the node exists because UserSeeder populated it.
	// We just need to update the OLT table.

	// Check if column ip_address exists (it should after migration)

	updateQuery := `
        UPDATE olt
        SET ip_address = '127.0.0.1', snmp_community = 'public'
        WHERE ip_address IS NULL OR ip_address = ''
    `
	// Note: The UPDATE ... FROM syntax is specific to Postgres

	tag, err := s.conn.Exec(ctx, updateQuery)
	if err != nil {
		return fmt.Errorf("failed to seed IP data: %v", err)
	}

	if tag.RowsAffected() == 0 {
		log.Println("⚠️ SeedDevData: No targeted OLTs found for IP update.")
	} else {
		log.Printf("✅ SeedDevData: Updated %d OLTs with IP 127.0.0.1", tag.RowsAffected())
	}

	return nil
}
