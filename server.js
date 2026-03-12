const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// 1. Tell the server to look in the root AND the 'files (33)' folder
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'files (33)')));

// 2. A more robust way to find your dashboard
app.get('/', (req, res) => {
    const locations = [
        path.join(__dirname, 'career-os-v2.html'),
        path.join(__dirname, 'files (33)', 'career-os-v2.html')
    ];
    
    const fs = require('fs');
    const fileToLink = locations.find(loc => fs.existsSync(loc));
    
    if (fileToLink) {
        res.sendFile(fileToLink);
    } else {
        res.status(404).json({ error: "Dashboard file not found in any directory" });
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT);
});
