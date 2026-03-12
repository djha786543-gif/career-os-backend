const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

// FIX 1: Trust Railway's Proxy (Stops the X-Forwarded-For error)
app.set('trust proxy', 1);
app.use(express.static(__dirname));

// LOGGING: See what the server sees on startup
console.log('--- Startup Audit ---');
console.log('Current Directory:', __dirname);
console.log('Files present:', fs.readdirSync(__dirname));

// FIX 2: Root Route with absolute path
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'career-os-v2.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard file not found. Files present: ' + fs.readdirSync(__dirname).join(', '));
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// RESTORE SEARCH: For Pooja's Japan results
app.get('/api/jobs', (req, res) => {
    const country = req.query.country || 'USA';
    res.json({ status: 'active', country: country, message: 'API logic ready' });
});

app.listen(PORT, '0.0.0.0', () => console.log('Server live on port ' + PORT));
