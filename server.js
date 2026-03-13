const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static(__dirname));

// Healthcheck for Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

// API ROUTE: This is what the dashboard is looking for
app.get('/api/jobs', (req, res) => {
    // Sending dummy data to prove the connection works
    res.json({ 
        status: 'success', 
        jobs: [], 
        message: 'Backend connected! Ready for real data.' 
    });
});

// DEFAULT ROUTE: Serve the dashboard
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'career-os-v2.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log('Server live on ' + PORT));
