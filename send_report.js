const http = require('http');
const fs = require('fs');
const msg = fs.readFileSync('/tmp/informe.txt', 'utf8');
const data = JSON.stringify({
  number: '34685203143',
  message: msg
});
const options = {
  hostname: 'localhost',
  port: 3009,
  path: '/api/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-session-token': '9729d7df9d2c6762f0380f763834a364be16a506d15a5f7823e59b207590892f'
  }
};
const req = http.request(options, (res) => {
  console.log('Status: ' + res.statusCode);
});
req.on('error', (e) => {
  console.error(e.message);
});
req.write(data);
req.end();
