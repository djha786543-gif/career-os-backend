const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static(__dirname));

// Healthcheck - Must return 200 for Railway to go green
app.get('/health', (req, res) => res.status(200).send('OK'));

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'career-os-v2.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Audit Server Active on Port ' + PORT);
});
