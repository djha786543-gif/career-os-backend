const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);

app.get('/', (req, res) => {
    const files = fs.readdirSync(__dirname);
    let html = '<h1>Railway File Discovery</h1><p><b>Current Dir:</b> ' + __dirname + '</p><ul>';
    files.forEach(file => { html += '<li>' + file + '</li>'; });
    html += '</ul><p>If you see your dashboard file in a subfolder, tell Gemini the folder name!</p>';
    res.send(html);
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, '0.0.0.0', () => console.log('Discovery server live on ' + PORT));
