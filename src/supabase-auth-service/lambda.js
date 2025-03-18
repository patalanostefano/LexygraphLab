const { spawn } = require('child_process');
const http = require('http');

// Environment variables that will be configured in Lambda
process.env.DATABASE_URL = process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET;
process.env.DISABLE_SIGNUP = process.env.DISABLE_SIGNUP || "false";
process.env.API_EXTERNAL_URL = process.env.API_EXTERNAL_URL;
process.env.SITE_URL = process.env.SITE_URL;
process.env.SMTP_ADMIN_EMAIL = process.env.SMTP_ADMIN_EMAIL;
process.env.SMTP_HOST = process.env.SMTP_HOST;
process.env.SMTP_PORT = process.env.SMTP_PORT;
process.env.SMTP_USER = process.env.SMTP_USER;
process.env.SMTP_PASS = process.env.SMTP_PASS;
process.env.SMTP_SENDER_NAME = process.env.SMTP_SENDER_NAME;
// Disable API key requirements for self-hosting
process.env.API_KEY_AUTH_ENABLED = "false";

let gotrueProcess = null;

// Start the GoTrue process when Lambda container initializes
function startGoTrue() {
  if (gotrueProcess) return;
  
  console.log('Starting GoTrue process...');
  
  gotrueProcess = spawn('./gotrue', ['serve'], {
    cwd: process.env.LAMBDA_TASK_ROOT,
    env: process.env
  });
  
  gotrueProcess.stdout.on('data', (data) => {
    console.log(`GoTrue stdout: ${data}`);
  });
  
  gotrueProcess.stderr.on('data', (data) => {
    console.error(`GoTrue stderr: ${data}`);
  });
  
  gotrueProcess.on('close', (code) => {
    console.log(`GoTrue process exited with code ${code}`);
    gotrueProcess = null;
  });
  
  // Give it time to start up
  return new Promise(resolve => setTimeout(resolve, 1000));
}

// Lambda handler function
exports.handler = async function(event, context) {
  // Ensure GoTrue is running
  if (!gotrueProcess) {
    await startGoTrue();
  }
  
  // Parse API Gateway event
  const path = event.path;
  const httpMethod = event.httpMethod;
  const headers = event.headers || {};
  const queryString = event.queryStringParameters || {};
  const body = event.body || '';
  
  // Forward request to GoTrue running on localhost
  const response = await makeRequest(path, httpMethod, headers, queryString, body);
  
  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body
  };
};

// Function to make HTTP request to local GoTrue process
function makeRequest(path, method, headers, queryParams, body) {
  const queryString = Object.keys(queryParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
    
  const options = {
    hostname: 'localhost',
    port: 9999, // Default GoTrue port
    path: `${path}${queryString ? '?' + queryString : ''}`,
    method: method,
    headers: headers
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Initialize GoTrue when the Lambda container first starts
startGoTrue();
