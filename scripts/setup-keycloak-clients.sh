#!/usr/bin/env bash
set -euo pipefail

# Parameters
KEYCLOAK_URL=$1
ADMIN_USER=$2
ADMIN_PASS=$3
CLIENT_SECRET=$4

echo "🔑 Logging in to Keycloak at ${KEYCLOAK_URL} as ${ADMIN_USER}..."
TOKEN_RESPONSE=$(curl -s -d "client_id=admin-cli" -d "username=${ADMIN_USER}" -d "password=${ADMIN_PASS}" -d "grant_type=password" "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token")
ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | jq -r .access_token)

if [ "${ACCESS_TOKEN}" == "null" ] || [ -z "${ACCESS_TOKEN}" ]; then
    echo "❌ Failed to obtain admin token. Response: ${TOKEN_RESPONSE}"
    exit 1
fi

# Check if ftth-gis-admin client already exists
echo "🔍 Checking if client 'ftth-gis-admin' exists..."
CLIENT_GET=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" "${KEYCLOAK_URL}/admin/realms/master/clients?clientId=ftth-gis-admin")
CLIENT_UUID=$(echo "${CLIENT_GET}" | jq -r '.[0].id // empty')

if [ -n "${CLIENT_UUID}" ]; then
    echo "ℹ️ Client 'ftth-gis-admin' already exists with UUID ${CLIENT_UUID}. Re-verifying configurations..."
    # Update client with correct secret if already exists
    CLIENT_JSON=$(cat <<EOF
{
  "id": "${CLIENT_UUID}",
  "clientId": "ftth-gis-admin",
  "name": "FTTH GIS Core Admin Client",
  "enabled": true,
  "secret": "${CLIENT_SECRET}",
  "publicClient": false,
  "serviceAccountsEnabled": true,
  "directAccessGrantsEnabled": false,
  "standardFlowEnabled": false,
  "clientAuthenticatorType": "client-secret"
}
EOF
)
    UPDATE_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X PUT -H "Authorization: Bearer ${ACCESS_TOKEN}" -H "Content-Type: application/json" -d "${CLIENT_JSON}" "${KEYCLOAK_URL}/admin/realms/master/clients/${CLIENT_UUID}")
    if [ "${UPDATE_RESP}" != "204" ] && [ "${UPDATE_RESP}" != "200" ]; then
        echo "❌ Failed to update client 'ftth-gis-admin'. Status: ${UPDATE_RESP}"
        exit 1
    fi
    echo "✅ Client 'ftth-gis-admin' secret updated successfully."
else
    echo "🆕 Client 'ftth-gis-admin' does not exist. Creating..."
    # Create client representation JSON
    CLIENT_JSON=$(cat <<EOF
{
  "clientId": "ftth-gis-admin",
  "name": "FTTH GIS Core Admin Client",
  "enabled": true,
  "secret": "${CLIENT_SECRET}",
  "publicClient": false,
  "serviceAccountsEnabled": true,
  "directAccessGrantsEnabled": false,
  "standardFlowEnabled": false,
  "clientAuthenticatorType": "client-secret"
}
EOF
)
    CREATE_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST -H "Authorization: Bearer ${ACCESS_TOKEN}" -H "Content-Type: application/json" -d "${CLIENT_JSON}" "${KEYCLOAK_URL}/admin/realms/master/clients")
    if [ "${CREATE_RESP}" != "201" ]; then
        echo "❌ Failed to create client 'ftth-gis-admin'. Status: ${CREATE_RESP}"
        exit 1
    fi
    echo "✅ Client 'ftth-gis-admin' created successfully."
    
    # Retrieve UUID of newly created client
    CLIENT_GET=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" "${KEYCLOAK_URL}/admin/realms/master/clients?clientId=ftth-gis-admin")
    CLIENT_UUID=$(echo "${CLIENT_GET}" | jq -r '.[0].id')
fi

# Get the 'admin' realm-level role
echo "🔍 Finding 'admin' realm-level role representation..."
ADMIN_ROLE_JSON=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" "${KEYCLOAK_URL}/admin/realms/master/roles/admin")
ADMIN_ROLE_NAME=$(echo "${ADMIN_ROLE_JSON}" | jq -r '.name // empty')

if [ -z "${ADMIN_ROLE_NAME}" ] || [ "${ADMIN_ROLE_NAME}" == "null" ]; then
    echo "❌ Failed to find 'admin' realm role."
    exit 1
fi
echo "✅ Found 'admin' realm role."

# Get service account user ID
echo "🔍 Fetching service account user for 'ftth-gis-admin'..."
SA_USER_GET=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" "${KEYCLOAK_URL}/admin/realms/master/clients/${CLIENT_UUID}/service-account-user")
SA_USER_ID=$(echo "${SA_USER_GET}" | jq -r '.id')

if [ -z "${SA_USER_ID}" ] || [ "${SA_USER_ID}" == "null" ]; then
    echo "❌ Failed to find service account user."
    exit 1
fi
echo "✅ Found service account user ID: ${SA_USER_ID}"

# Assign the 'admin' realm role to the service account user
echo "🛡️ Assigning realm role 'admin' to service account user..."
ASSIGN_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST -H "Authorization: Bearer ${ACCESS_TOKEN}" -H "Content-Type: application/json" -d "[${ADMIN_ROLE_JSON}]" "${KEYCLOAK_URL}/admin/realms/master/users/${SA_USER_ID}/role-mappings/realm")

if [ "${ASSIGN_RESP}" != "204" ] && [ "${ASSIGN_RESP}" != "200" ]; then
    echo "❌ Failed to assign role. Status: ${ASSIGN_RESP}"
    exit 1
fi
echo "✅ Realm-level role 'admin' assigned successfully."
echo "🎉 Setup for client 'ftth-gis-admin' completed successfully!"
