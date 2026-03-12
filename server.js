const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;

// LOG THE FILES: This helps us see exactly where the HTML file is
console.log("Current Directory:", __dirname);
console.log("Files found:", fs.readdirSync(__dirname));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'career-os-v2.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("File not found at " + filePath + ". Found these instead: " + fs.readdirSync(__dirname));
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, '0.0.0.0', () => console.log('Listening on ' + PORT));
