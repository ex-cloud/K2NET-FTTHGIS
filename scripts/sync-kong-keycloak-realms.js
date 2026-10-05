#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

async function main() {
  console.log('🔄 [Kong Keycloak Sync] Starting multi-realm JWT sync...');

  // 1. Get Keycloak IP from docker
  let keycloakIp = '172.18.0.24';
  try {
    keycloakIp = execSync("docker inspect ftth-keycloak --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'", { encoding: 'utf-8' }).trim();
  } catch (e) {
    console.warn('⚠️ Could not inspect ftth-keycloak, using default:', keycloakIp);
  }
  console.log(`🌐 Keycloak IP: ${keycloakIp}:8081`);

  // 2. Query Postgres for organizations and realms
  let realms = ['ftth-realm', 'default', 'fiber-nusantara', 'hshqwvnwzsdbeqqifkpu', 'mjrbxnoozcbjahhahqna', 'hrwdjkorvtwmakjkdfxd'];
  try {
    const psqlOutput = execSync('docker exec ftth-postgres psql -U postgres -d ftth_gis -t -A -c "SELECT DISTINCT COALESCE(realm_key, slug) FROM organizations WHERE slug IS NOT NULL;"', { encoding: 'utf-8' });
    const dbRealms = psqlOutput.split('\n').map(s => s.trim()).filter(Boolean);
    for (const r of dbRealms) {
      if (!realms.includes(r)) realms.push(r);
    }
  } catch (err) {
    console.warn('⚠️ Could not query Postgres organizations:', err.message);
  }
  console.log(`📋 Found ${realms.length} realms to sync:`, realms);

  // 3. Fetch JWKS for each realm and convert to PEM
  const consumerList = [];

  for (const realm of realms) {
    const jwksUrl = `http://${keycloakIp}:8081/realms/${realm}/protocol/openid-connect/certs`;
    try {
      const jwksData = await new Promise((resolve, reject) => {
        const req = http.get(jwksUrl, { timeout: 4000 }, (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Status ${res.statusCode}`));
          }
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });

      const keys = jwksData.keys || [];
      const rsaSigKey = keys.find(k => k.kty === 'RSA' && (k.use === 'sig' || !k.use));

      if (!rsaSigKey) {
        console.warn(`⚠️ No RSA sig key found for realm '${realm}'`);
        continue;
      }

      // Convert JWK to PEM
      const pubKey = crypto.createPublicKey({ key: rsaSigKey, format: 'jwk' });
      const pem = pubKey.export({ type: 'spki', format: 'pem' });

      consumerList.push({
        username: `keycloak-${realm}`,
        realm,
        key: `https://auth-gis.kdua.net/realms/${realm}`,
        pem: pem.trim(),
      });
      console.log(`✅ Converted RSA Key for realm: ${realm}`);
    } catch (err) {
      console.warn(`⚠️ Failed to fetch/parse JWKS for realm '${realm}':`, err.message);
    }
  }

  if (consumerList.length === 0) {
    console.error('❌ No consumers could be built! Aborting.');
    process.exit(1);
  }

  // 4. Update docker/kong/kong.yml
  const kongYmlPath = path.resolve(__dirname, '../docker/kong/kong.yml');
  const kongContent = fs.readFileSync(kongYmlPath, 'utf-8');

  // Build YAML string for consumers
  let consumersYaml = 'consumers:\n';
  for (const c of consumerList) {
    consumersYaml += `  # Keycloak consumer for realm: ${c.realm}\n`;
    consumersYaml += `  - username: ${c.username}\n`;
    consumersYaml += `    jwt_secrets:\n`;
    consumersYaml += `      - key: "${c.key}"\n`;
    consumersYaml += `        algorithm: RS256\n`;
    consumersYaml += `        rsa_public_key: |\n`;
    for (const line of c.pem.split('\n')) {
      consumersYaml += `          ${line}\n`;
    }
    consumersYaml += '\n';
  }
  consumersYaml += '  # Anonymous consumer — allows requests without a valid JWT to pass through\n';
  consumersYaml += '  - username: anonymous-user\n\n';

  // Replace consumers block in kong.yml
  const updatedKongContent = kongContent.replace(
    /consumers:[\s\S]*?(?=\n# =+[\r\n]+# Services|\nservices:)/,
    consumersYaml.trimEnd() + '\n'
  );

  fs.writeFileSync(kongYmlPath, updatedKongContent, 'utf-8');
  console.log(`💾 Updated ${kongYmlPath} with ${consumerList.length} Keycloak consumers!`);

  // 5. Post to Kong Admin API (/config)
  console.log('🚀 Pushing updated config to Kong Admin API (http://127.0.0.1:8001/config)...');
  try {
    const boundary = '----KongConfigBoundary' + Date.now();
    let body = '';
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="config"; filename="kong.yml"\r\n';
    body += 'Content-Type: application/x-yaml\r\n\r\n';
    body += updatedKongContent + '\r\n';
    body += `--${boundary}--\r\n`;

    const postOptions = {
      hostname: '127.0.0.1',
      port: 8001,
      path: '/config',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(postOptions, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: respData }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('🎉 SUCCESS: Kong API Gateway declarative config reloaded successfully!');
    } else {
      console.warn(`⚠️ Kong Admin /config returned status ${response.statusCode}:`, response.body);
    }
  } catch (err) {
    console.error('❌ Failed to push to Kong Admin API:', err.message);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
