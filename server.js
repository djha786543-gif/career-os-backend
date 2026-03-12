const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// This ensures all your CSS/JS/Images are found
app.use(express.static(path.join(__dirname)));

// This forces the root URL to show your specific dashboard file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'career-os-v2.html'));
});

// Adding the health route just to be safe for Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on port ' + PORT);
});
