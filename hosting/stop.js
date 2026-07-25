/**
 * Utility to stop the hosting server by sending a shutdown signal.
 * Usage: node stop.js
 */
const http = require('http');

const PORT = process.env.PORT || process.argv[2] || 3000;

const req = http.request(
  {
    hostname: 'localhost',
    port: PORT,
    path: '/health',
    method: 'GET',
    timeout: 3000,
  },
  (res) => {
    console.log(`Server at port ${PORT} is running. Sending stop request...`);

    // Send a POST to a shutdown endpoint (or we rely on SIGINT via taskkill on Windows)
    const shutdownReq = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/shutdown',
        method: 'POST',
        timeout: 3000,
      }
    );
    shutdownReq.on('error', () => {
      // If that doesn't work, instruct the user
      console.log(`\nCould not stop gracefully. Run this in PowerShell:`);
      console.log(`  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} -State Listen).OwningProcess -Force`);
    });
    shutdownReq.end();
  }
);

req.on('error', () => {
  console.log(`No server found running on port ${PORT}.`);
});

req.end();
