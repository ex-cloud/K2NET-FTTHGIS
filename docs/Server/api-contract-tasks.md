# 🎫 API Contract: Task & Ticket Management System

This document outlines the API contract, request/response formats, security parameters, and visibility scope matrix for managing tasks and support tickets under the **FTTH GIS — K2NET Enterprise SaaS Platform**.

---

## 🧭 Scope Matrix & Visibility Rules

Tasks are classified into three scopes (`TaskScope`) which dictate visibility and access control constraints across the **Portal Utama (studio-admin)** and **Portal Tenant (studio-tenant)**:

| Scope Name | Created By | Visible In (Primary Portal) | Visible In (Tenant Portal) | Purpose / Description |
|---|---|---|---|---|
| `PLATFORM_INTERNAL` | Super Admin | **Yes** (Internal tasks view) | **No** (Strictly hidden) | Platform infrastructure tasks, DevOps alerts, internal sprint tasks. |
| `TENANT_TO_PLATFORM` | Tenant NOC User / Super Admin | **Yes** (B2B Inbox view) | **Yes** (Tenant Outbox view) | Support escalation tickets sent from a tenant (ISP NOC) to K2NET. |
| `TENANT_INTERNAL` | Tenant NOC User | **No** (Strictly hidden) | **Yes** (Tenant internal view) | Isolated tenant-only tasks (e.g. ODP installations, fiber splicing). |

> [!IMPORTANT]
> **Air-Gap Constraint**: 
> A caller authenticated as a **Super Admin** (possessing `super_admin` or `ROLE_SUPER_ADMIN` Keycloak role claims) is **strictly forbidden** from creating tasks with `scope = TENANT_INTERNAL`. Attempting to do so will result in an immediate `403 Forbidden` response.

---

## 🔌 API Endpoints

### 1. Create Task / Ticket
* **Method**: `POST`
* **Path**: `/api/v1/tasks`
* **Headers**:
  * `Authorization: Bearer <JWT_TOKEN>` (Keycloak Access Token)
  * `Content-Type: application/json`

#### Request Payload (`CreateTaskRequest`)
```json
{
  "type": "TICKET", 
  "title": "ODP-BDG-012 port failure",
  "description": "Port 3 on ODP-BDG-012 shows zero optical power. Need inspection.",
  "priority": "HIGH",
  "assigneeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "dueDate": "2026-08-15T18:00:00Z",
  "scope": "TENANT_TO_PLATFORM",
  "referenceType": "ODP",
  "referenceId": "ODP-BDG-012",
  "coordinates": [107.6191, -6.9175]
}
```

* **Field Specifications**:
  * `type` (Required): `TICKET` or `PROJECT`.
  * `title` (Required): Min 3, max 500 characters.
  * `priority` (Optional): `URGENT`, `HIGH`, `NORMAL`, `LOW` (Defaults to `NORMAL`).
  * `scope` (Optional):
    * If omitted by a **Super Admin**: Defaults to `PLATFORM_INTERNAL`.
    * If omitted by a **Tenant Caller**: Defaults to `TENANT_INTERNAL`.
  * `coordinates` (Optional): `[lng, lat]` coordinates. Only valid and saved if scope is `TENANT_INTERNAL` or `TENANT_TO_PLATFORM`.

#### Response Payload (`TaskDTO` - Status: `201 Created`)
```json
{
  "id": "9ea4058b-cfbf-4be3-b789-f5617a2283ea",
  "type": "TICKET",
  "status": "TODO",
  "priority": "HIGH",
  "scope": "TENANT_TO_PLATFORM",
  "title": "ODP-BDG-012 port failure",
  "description": "Port 3 on ODP-BDG-012 shows zero optical power. Need inspection.",
  "reporterId": "1ffe8d2c-42de-4370-a5f8-163a69f33d74",
  "assigneeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "organizationId": "00000000-0000-0000-0000-000000000001",
  "referenceType": "ODP",
  "referenceId": "ODP-BDG-012",
  "parentTaskId": null,
  "dueDate": "2026-08-15T18:00:00",
  "resolvedAt": null,
  "obsidianRef": "TKT-2026-08-001",
  "comments": [],
  "createdAt": "2026-08-10T01:50:00",
  "createdBy": "admin.test",
  "updatedAt": "2026-08-10T01:50:00",
  "updatedBy": "admin.test"
}
```

---

### 2. List Tasks / Tickets
* **Method**: `GET`
* **Path**: `/api/v1/tasks`
* **Parameters**:
  * `scope` (Optional): Filter list by scope name (`PLATFORM_INTERNAL`, `TENANT_TO_PLATFORM`, or `TENANT_INTERNAL`).
  * `page` (Optional): Page index (Default: `0`).
  * `size` (Optional): Page size (Default: `20`).
  * `sort` (Optional): Sort field (Default: `createdAt`).
  * `direction` (Optional): Sort order (Default: `DESC`).

#### Behavior:
* **Super Admin (No scope parameter)**: Automatically returns a combined list of both `PLATFORM_INTERNAL` and `TENANT_TO_PLATFORM` tasks across all tenants (tenant isolation filter is bypassed).
* **Tenant User (No scope parameter)**: Hibernate filter restricts query output strictly to the user's `organization_id` tenant data.

---

### 3. Real-Time Task Notification Stream (SSE)
* **Method**: `GET`
* **Path**: `/api/v1/tasks/stream`
* **Parameters**:
  * `access_token` (Required query parameter): Keycloak JWT access token used to authenticate the SSE client (since default HTML `EventSource` interface does not allow setting custom authorization request headers).
* **Headers**:
  * `Accept: text/event-stream`

#### Server-Sent Events Formats:

##### Handshake Event (`INIT`)
```event
event: INIT
data: Connected to K2NET live task stream
```

##### Task Created Event (`TASK_CREATED`)
Fires when a new task with scope `TENANT_TO_PLATFORM` is created (notifies all platform admin connections of a new B2B ticket).
```event
event: TASK_CREATED
data: {"id":"9ea4058b-cfbf-4be3-b789-f5617a2283ea","obsidianRef":"TKT-2026-08-001","title":"ODP-BDG-012 port failure","scope":"TENANT_TO_PLATFORM","type":"TICKET","createdAt":"2026-08-10T01:50:00"}
```
