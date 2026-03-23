const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log("AVAILABLE MODELS FOR THIS KEY:");
        parsed.models.forEach(m => console.log(m.name));
      } else {
        console.log("Response:", parsed);
      }
    } catch(e) {
      console.error(e);
    }
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
