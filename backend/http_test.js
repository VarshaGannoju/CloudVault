const http = require('http');

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
  });
}

// But wait, I need a valid token.
// Let's just create a token for the user.
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '2ae36f01-6454-418b-b36e-7c2e4ac134a9', role: 'user' }, process.env.JWT_SECRET || 'jwt_secret_key_cloudvault_2026_super_secure', { expiresIn: '1d' });

async function run() {
  try {
    const foldersReq = await request('/folders');
    console.log('/folders:', foldersReq.status, foldersReq.data);

    const filesReq = await request('/files');
    console.log('/files:', filesReq.status, filesReq.data);

    const shareReq = await request('/share/shared-with-me');
    console.log('/share/shared-with-me:', shareReq.status, shareReq.data);
  } catch(e) {
    console.error(e);
  }
}

// Ensure process.env.JWT_SECRET is correct by loading .env
require('dotenv').config({ path: 'c:/Users/VARSHA GANNOJU/Downloads/CloudVault-step1/CloudVault/backend/.env' });
const actualToken = jwt.sign({ id: '2ae36f01-6454-418b-b36e-7c2e4ac134a9', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1d' });

function requestWithToken(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
  });
}

async function runReal() {
  try {
    const foldersReq = await requestWithToken('/folders', actualToken);
    console.log('/folders:', foldersReq.status, foldersReq.data);

    const filesReq = await requestWithToken('/files', actualToken);
    console.log('/files:', filesReq.status, filesReq.data);

    const shareReq = await requestWithToken('/share/shared-with-me', actualToken);
    console.log('/share/shared-with-me:', shareReq.status, shareReq.data);
  } catch(e) {
    console.error(e);
  }
}
runReal();
