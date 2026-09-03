#!/usr/bin/env bash
set -e

echo "=== 1. Login Keycloak & Start Sesi ==="
TOKEN_JSON=$(curl -s -k -X POST -H "Host: auth-gis.kdua.net" \
  -d "client_id=ftth-gis-frontend" \
  -d "grant_type=password" \
  -d "username=xsuperadmin" \
  -d "password=Password@123" \
  https://127.0.0.1:443/realms/ftth-realm/protocol/openid-connect/token)

TOKEN=$(echo "$TOKEN_JSON" | jq -r .access_token)
REFRESH_TOKEN=$(echo "$TOKEN_JSON" | jq -r .refresh_token)

START_RESP=$(curl -s -k -X POST -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"reason\":\"Investigasi gangguan ODP pelanggan wilayah timur\",\"ticketReference\":\"TKT-2026-999\",\"refreshToken\":\"${REFRESH_TOKEN}\"}" \
  https://127.0.0.1:443/api/v1/system/tenants/00000000-0000-0000-0000-000000000002/impersonate/start)

echo "Start response: $START_RESP"
SESSION_ID=$(echo "$START_RESP" | jq -r .sessionId)
EXCHANGE_CODE=$(echo "$START_RESP" | jq -r .exchangeCode)

echo "=== 2. Tukar Exchange Code (Pertama -> Harus 200 OK) ==="
EXCHANGE_RESP=$(curl -s -k -i -X POST -H "Host: system-gis.kdua.net" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"${EXCHANGE_CODE}\"}" \
  https://127.0.0.1:443/api/v1/system/impersonate/exchange)
echo "$EXCHANGE_RESP"

echo "=== 3. Tukar Exchange Code yang SAMA (Kedua -> Harus 400 Bad Request) ==="
SECOND_EXCHANGE=$(curl -s -k -i -X POST -H "Host: system-gis.kdua.net" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"${EXCHANGE_CODE}\"}" \
  https://127.0.0.1:443/api/v1/system/impersonate/exchange)
echo "$SECOND_EXCHANGE"

echo "=== 4. Check Status Sesi (Harus 200 OK & active=true) ==="
STATUS_RESP=$(curl -s -k -i -X GET -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Impersonation-Session-Id: ${SESSION_ID}" \
  https://127.0.0.1:443/api/v1/system/impersonate/status)
echo "$STATUS_RESP"

echo "=== 4b. Kong Edge Defense-in-Depth: Status TANPA Bearer Token (Harus 401 Unauthorized dari Kong) ==="
KONG_BLOCK_RESP=$(curl -s -k -i -X GET -H "Host: system-gis.kdua.net" \
  -H "X-Impersonation-Session-Id: ${SESSION_ID}" \
  https://127.0.0.1:443/api/v1/system/impersonate/status)
echo "$KONG_BLOCK_RESP"

echo "=== 5. Query Data Tenant Target dengan Header Impersonasi (Harus 200 OK) ==="
CUST_RESP=$(curl -s -k -i -X GET -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Impersonation-Session-Id: ${SESSION_ID}" \
  https://127.0.0.1:443/api/v1/network/customers)
echo "$CUST_RESP"

echo "=== 6. Anti-Spoofing Param Test (Kirim organizationId main org, harus tetap tenant target) ==="
SPOOF_RESP=$(curl -s -k -i -X GET -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Impersonation-Session-Id: ${SESSION_ID}" \
  "https://127.0.0.1:443/api/v1/network/customers?organizationId=00000000-0000-0000-0000-000000000001")
echo "$SPOOF_RESP"

echo "=== 7. Invalid/Expired Session Header Test (Harus 401 Unauthorized) ==="
INVALID_RESP=$(curl -s -k -i -X GET -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Impersonation-Session-Id: 00000000-0000-0000-0000-999999999999" \
  https://127.0.0.1:443/api/v1/network/customers)
echo "$INVALID_RESP"

echo "=== 8. Server-Side Refresh Relay Test (Harus 200 OK & new token) ==="
REFRESH_RESP=$(curl -s -k -i -X POST -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Impersonation-Session-Id: ${SESSION_ID}" \
  https://127.0.0.1:443/api/v1/system/impersonate/refresh-token)
echo "$REFRESH_RESP"

echo "=== 9. Exit Sesi Impersonasi ==="
EXIT_RESP=$(curl -s -k -i -X POST -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Impersonation-Session-Id: ${SESSION_ID}" \
  https://127.0.0.1:443/api/v1/system/impersonate/exit)
echo "$EXIT_RESP"

echo "=== 10. Akses Data Tenant Setelah Exit (Harus 403 Forbidden God Mode Boundary) ==="
AFTER_EXIT=$(curl -s -k -i -X GET -H "Host: system-gis.kdua.net" \
  -H "Authorization: Bearer ${TOKEN}" \
  https://127.0.0.1:443/api/v1/network/customers)
echo "$AFTER_EXIT"
