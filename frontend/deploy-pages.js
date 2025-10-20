const fs = require('fs');
const path = require('path');
const https = require('https');

const ACCOUNT_ID = 'd2897bdebfa128919bd89b265e6a712e';
const API_TOKEN = 'Z5Jo1dY_yYcKhXd_QgHj1H0qGgAIhB84W-OOOgHV';
const PROJECT_NAME = 'protothrive-frontend';
const OUT_DIR = path.join(__dirname, 'out');

// Read all files from out directory
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      const relativePath = path.relative(OUT_DIR, filePath).replace(/\\/g, '/');
      fileList.push({
        path: relativePath,
        content: fs.readFileSync(filePath, 'base64')
      });
    }
  });
  return fileList;
}

async function deploy() {
  console.log('📦 Collecting files...');
  const files = getFiles(OUT_DIR);
  console.log(`✅ Found ${files.length} files`);

  // Create manifest
  const manifest = {};
  files.forEach(file => {
    manifest[`/${file.path}`] = file.content;
  });

  const payload = JSON.stringify({ manifest });

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  console.log('🚀 Uploading to Cloudflare Pages...');

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✅ Deployment successful!');
        console.log(`📍 URL: ${response.result.url}`);
        console.log(`🆔 Deployment ID: ${response.result.id}`);
      } else {
        console.error('❌ Deployment failed:', response.errors);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error);
  });

  req.write(payload);
  req.end();
}

deploy();
