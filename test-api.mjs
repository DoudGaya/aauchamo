import http from 'http';

const req = http.get('http://127.0.0.1:3000/api/dashboard/station-performance', (res) => {
  console.log(`Status 127: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(`Body 127: ${data}`));
});
req.on('error', () => {});

const req2 = http.get('http://localhost:3000/api/dashboard/station-performance', (res) => {
  console.log(`Status local: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(`Body local: ${data}`));
});
req2.on('error', () => {});

const req3 = http.get('http://192.168.100.14:3000/api/dashboard/station-performance', (res) => {
  console.log(`Status IP: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(`Body IP: ${data}`));
});
req3.on('error', () => {});
