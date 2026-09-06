-- V35__add_supervisor_role_and_permissions.sql
-- Registrasi role TENT-07 supervisor (Field Supervisor) sesuai Master Blueprint RBAC

-- 1. Insert Role supervisor jika belum ada
INSERT INTO roles (name, code, description, scope, is_system_role, created_at, updated_at)
SELECT 
    'supervisor', 
    'TENT-07', 
    'Field Supervisor: Penyelia tim lapangan, approval rencana kerja, evaluasi progres penarikan kabel, dan manajemen tiket teknisi lintas proyek.', 
    'TENANT', 
    true, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'supervisor');

-- Pastikan kode TENT-07 terisi jika supervisor sudah ada
UPDATE roles 
SET code = 'TENT-07', scope = 'TENANT', is_system_role = true, updated_at = NOW()
WHERE name = 'supervisor' AND (code IS NULL OR code != 'TENT-07');

-- 2. Mapping permissions untuk role supervisor
-- Hak akses: Supervisi Jaringan Lintas Proyek (All-Projects), Approval Rencana, Tiket & Penugasan, GIS Peta, Inventaris View/Report
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'supervisor'
  AND p.code IN (
      -- Proyek
      'projects.view',
      'projects.edit',
      'projects.export',
      -- Jaringan & GIS (Termasuk All-Projects Tier)
      'network.view',
      'network.monitor',
      'network.manage',
      'network.manage.all-projects',
      'network.nodes',
      'network.audit',
      'map.view',
      'map.edit',
      'coverage.view',
      -- Tiket & Penugasan Lapangan
      'ticket.view',
      'ticket.create',
      'ticket.update',
      'ticket.assign',
      'task.update',
      'approval.manage',
      -- Pelanggan & Laporan
      'customer.view',
      'report.view',
      'report.export',
      -- Inventaris & Tim
      'inventory.view',
      'inventory.report',
      'team.view'
  )
ON CONFLICT DO NOTHING;
