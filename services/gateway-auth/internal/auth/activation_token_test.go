package auth

import "testing"

const rawActivationJSON = `{"userId":"10f9f37f-14eb-42cf-8db2-0054c4229f59","orgName":"TEST TENANT","adminEmail":"a@b.c","adminUsername":"andiansyah","orgId":"4b70d13a-1a0c-417c-bb6e-bdf71eb8b2eb","orgSlug":"test-tenant"}`

// Exactly what Spring's GenericJackson2JsonRedisSerializer stored for the tenant that hit
// "Invalid or Expired Link": the JSON wrapped as an escaped string literal.
const doubleEncodedActivationJSON = `"{\"userId\":\"10f9f37f-14eb-42cf-8db2-0054c4229f59\",\"orgName\":\"TEST TENANT\",\"adminEmail\":\"a@b.c\",\"adminUsername\":\"andiansyah\",\"orgId\":\"4b70d13a-1a0c-417c-bb6e-bdf71eb8b2eb\",\"orgSlug\":\"test-tenant\"}"`

func TestDecodeActivationToken_RawAndDoubleEncoded(t *testing.T) {
	for name, raw := range map[string]string{
		"raw json":       rawActivationJSON,
		"double encoded": doubleEncodedActivationJSON,
	} {
		data, err := decodeActivationToken(raw)
		if err != nil {
			t.Fatalf("%s: unexpected error: %v", name, err)
		}
		if data.OrgSlug != "test-tenant" || data.UserID == "" || data.OrgID == "" {
			t.Fatalf("%s: wrong payload: %+v", name, data)
		}
	}
}

func TestDecodeActivationToken_RejectsGarbageAndIncomplete(t *testing.T) {
	for name, raw := range map[string]string{
		"empty":      "",
		"not json":   "abc",
		"bad string": `"unterminated`,
		"incomplete": `{"orgSlug":"x"}`,
	} {
		if _, err := decodeActivationToken(raw); err == nil {
			t.Fatalf("%s: expected error", name)
		}
	}
}

