const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// 1. Serve static files (CSS, Images, JS)
app.use(express.static(__dirname));

// 2. Dashboard Route - The "Face"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'career-os-v2.html'));
});

// 3. Health Route - For Railway's Peace of Mind
app.get('/health', (req, res) => res.status(200).send('OK'));

// 4. Jobs API - The "Brain" (Matches the JSON you just saw)
app.get('/api/jobs', (req, res) => {
    // This allows your dashboard to pull that JSON data
    res.sendFile(path.join(__dirname, 'server.js')); // Temporarily serving the JSON logic
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on Port ' + PORT);
});
