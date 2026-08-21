#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# rebuild-keycloak-realm.sh
# One-time script to rebuild ftth-realm configuration after data loss.
# Run inside docker network: 
#   docker run --rm --network project5_default alpine/curl sh -c "$(cat scripts/rebuild-keycloak-realm.sh)"
# Or mount and execute:
#   docker run --rm --network project5_default -v $(pwd)/scripts:/scripts alpine/curl sh /scripts/rebuild-keycloak-realm.sh
# =============================================================================

KEYCLOAK_URL="${KEYCLOAK_URL:-http://keycloak:8081}"
ADMIN_USER="${KC_ADMIN_USER:-excloud}"
ADMIN_PASS="${KC_ADMIN_PASSWORD:-3pHx9nTw4v5Q2zYrS}"
REALM="ftth-realm"

GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-935023538704-4k53si0vhnhl8lb8ahu57eviji9rt87m.apps.googleusercontent.com}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-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}"
GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-Ov23liDew676RcoefTAW}"
GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-7a1fa6ab81e01721bfd8a0b94f2abaec457c5df8}"

# SMTP Configuration (Brevo/Sendinblue)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="ac9057001@smtp-brevo.com"
SMTP_PASS="${SMTP_PASSWORD:-}"
SMTP_FROM="noreply@kdua.net"
SMTP_FROM_DISPLAY="FTTH GIS Platform"

echo "=============================================="
echo "  Keycloak ftth-realm Configuration Rebuild"
echo "=============================================="

# --- Step 1: Get Admin Token ---
echo ""
echo "🔑 Step 1: Authenticating to Keycloak..."
TOKEN_RESPONSE=$(curl -s -d "client_id=admin-cli" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASS}" \
  -d "grant_type=password" \
  "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token")

ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | jq -r '.access_token // empty')

if [ -z "${ACCESS_TOKEN}" ]; then
    echo "❌ Failed to obtain admin token. Response: ${TOKEN_RESPONSE}"
    exit 1
fi
echo "✅ Admin token acquired."

# --- Step 2: Update Realm Settings ---
echo ""
echo "⚙️  Step 2: Updating realm settings (session, login, brute force)..."

REALM_UPDATE_JSON=$(cat <<'ENDJSON'
{
  "displayName": "FTTH GIS Platform",
  "enabled": true,
  "registrationAllowed": false,
  "resetPasswordAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "verifyEmail": false,
  "bruteForceProtected": true,
  "failureFactor": 5,
  "maxDeltaTimeSeconds": 43200,
  "maxFailureWaitSeconds": 900,
  "waitIncrementSeconds": 60,
  "minimumQuickLoginWaitSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "permanentLockout": false,
  "ssoSessionIdleTimeout": 28800,
  "ssoSessionMaxLifespan": 86400,
  "accessTokenLifespan": 300,
  "offlineSessionMaxLifespanEnabled": true,
  "offlineSessionMaxLifespan": 259200,
  "offlineSessionIdleTimeout": 86400,
  "clientSessionIdleTimeout": 0,
  "clientSessionMaxLifespan": 0,
  "revokeRefreshToken": false,
  "refreshTokenMaxReuse": 0,
  "internationalizationEnabled": false,
  "defaultLocale": "en"
}
ENDJSON
)

REALM_RESP=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${REALM_UPDATE_JSON}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}")

REALM_STATUS=$(echo "${REALM_RESP}" | tail -1)
if [ "${REALM_STATUS}" = "204" ] || [ "${REALM_STATUS}" = "200" ]; then
    echo "✅ Realm settings updated successfully."
else
    echo "⚠️  Realm update returned status: ${REALM_STATUS}"
    echo "   Response: $(echo "${REALM_RESP}" | head -1)"
fi

# --- Step 3: Configure SMTP ---
echo ""
echo "📧 Step 3: Configuring SMTP (Brevo)..."

# Build SMTP JSON - only include password if set
if [ -n "${SMTP_PASS}" ]; then
    SMTP_AUTH="true"
    SMTP_PASS_JSON="\"password\": \"${SMTP_PASS}\","
else
    SMTP_AUTH="false"
    SMTP_PASS_JSON=""
    echo "   ⚠️  No SMTP password provided. Email features will be limited."
fi

SMTP_JSON=$(cat <<ENDJSON
{
  "smtpServer": {
    "host": "${SMTP_HOST}",
    "port": "${SMTP_PORT}",
    "from": "${SMTP_FROM}",
    "fromDisplayName": "${SMTP_FROM_DISPLAY}",
    "auth": "${SMTP_AUTH}",
    "user": "${SMTP_USER}",
    ${SMTP_PASS_JSON}
    "starttls": "true",
    "ssl": "false"
  }
}
ENDJSON
)

SMTP_RESP=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${SMTP_JSON}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}")

SMTP_STATUS=$(echo "${SMTP_RESP}" | tail -1)
if [ "${SMTP_STATUS}" = "204" ] || [ "${SMTP_STATUS}" = "200" ]; then
    echo "✅ SMTP configuration applied."
else
    echo "⚠️  SMTP update returned status: ${SMTP_STATUS}"
    echo "   Response: $(echo "${SMTP_RESP}" | head -1)"
fi

# --- Step 4: Create Google Identity Provider ---
echo ""
echo "🔍 Step 4: Creating Google Identity Provider..."

# Check if already exists
GOOGLE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances/google")

if [ "${GOOGLE_CHECK}" = "200" ]; then
    echo "   ℹ️  Google IDP already exists. Updating..."
    GOOGLE_METHOD="PUT"
    GOOGLE_URL="${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances/google"
else
    echo "   🆕 Creating new Google IDP..."
    GOOGLE_METHOD="POST"
    GOOGLE_URL="${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances"
fi

GOOGLE_IDP_JSON=$(cat <<ENDJSON
{
  "alias": "google",
  "providerId": "google",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "${GOOGLE_CLIENT_ID}",
    "clientSecret": "${GOOGLE_CLIENT_SECRET}",
    "defaultScope": "openid email profile",
    "syncMode": "IMPORT",
    "guiOrder": "1"
  }
}
ENDJSON
)

GOOGLE_RESP=$(curl -s -w "\n%{http_code}" -X ${GOOGLE_METHOD} \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${GOOGLE_IDP_JSON}" \
  "${GOOGLE_URL}")

GOOGLE_STATUS=$(echo "${GOOGLE_RESP}" | tail -1)
if [ "${GOOGLE_STATUS}" = "201" ] || [ "${GOOGLE_STATUS}" = "204" ] || [ "${GOOGLE_STATUS}" = "200" ]; then
    echo "✅ Google Identity Provider configured successfully."
else
    echo "❌ Google IDP creation failed. Status: ${GOOGLE_STATUS}"
    echo "   Response: $(echo "${GOOGLE_RESP}" | head -1)"
fi

# --- Step 5: Create GitHub Identity Provider ---
echo ""
echo "🐙 Step 5: Creating GitHub Identity Provider..."

GITHUB_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances/github")

if [ "${GITHUB_CHECK}" = "200" ]; then
    echo "   ℹ️  GitHub IDP already exists. Updating..."
    GITHUB_METHOD="PUT"
    GITHUB_URL="${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances/github"
else
    echo "   🆕 Creating new GitHub IDP..."
    GITHUB_METHOD="POST"
    GITHUB_URL="${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances"
fi

GITHUB_IDP_JSON=$(cat <<ENDJSON
{
  "alias": "github",
  "providerId": "github",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "${GITHUB_CLIENT_ID}",
    "clientSecret": "${GITHUB_CLIENT_SECRET}",
    "defaultScope": "user:email",
    "syncMode": "IMPORT",
    "guiOrder": "2"
  }
}
ENDJSON
)

GITHUB_RESP=$(curl -s -w "\n%{http_code}" -X ${GITHUB_METHOD} \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${GITHUB_IDP_JSON}" \
  "${GITHUB_URL}")

GITHUB_STATUS=$(echo "${GITHUB_RESP}" | tail -1)
if [ "${GITHUB_STATUS}" = "201" ] || [ "${GITHUB_STATUS}" = "204" ] || [ "${GITHUB_STATUS}" = "200" ]; then
    echo "✅ GitHub Identity Provider configured successfully."
else
    echo "❌ GitHub IDP creation failed. Status: ${GITHUB_STATUS}"
    echo "   Response: $(echo "${GITHUB_RESP}" | head -1)"
fi

# --- Step 6: Verification ---
echo ""
echo "🔍 Step 6: Verifying configuration..."

# Check IDPs
IDP_LIST=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/identity-provider/instances")
IDP_COUNT=$(echo "${IDP_LIST}" | jq 'length')
echo "   Identity Providers configured: ${IDP_COUNT}"
echo "${IDP_LIST}" | jq -r '.[] | "   - \(.alias) (\(.providerId)) enabled=\(.enabled)"'

# Check realm settings
REALM_INFO=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}")
echo "   SSO Session Idle: $(echo "${REALM_INFO}" | jq '.ssoSessionIdleTimeout')s"
echo "   SSO Session Max: $(echo "${REALM_INFO}" | jq '.ssoSessionMaxLifespan')s"
echo "   Access Token Lifespan: $(echo "${REALM_INFO}" | jq '.accessTokenLifespan')s"
echo "   Reset Password Allowed: $(echo "${REALM_INFO}" | jq '.resetPasswordAllowed')"
echo "   Brute Force Protected: $(echo "${REALM_INFO}" | jq '.bruteForceProtected')"
SMTP_HOST_CHECK=$(echo "${REALM_INFO}" | jq -r '.smtpServer.host // "NOT SET"')
echo "   SMTP Host: ${SMTP_HOST_CHECK}"

echo ""
echo "=============================================="
echo "  ✅ Keycloak ftth-realm rebuild complete!"
echo "=============================================="
