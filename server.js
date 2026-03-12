const express = require('express');
const path = require('path');
const app = express();

// RAILWAY CONFIG: Use their PORT and bind to 0.0.0.0
const PORT = process.env.PORT || 3001;

app.use(express.static(__dirname));

// HEALTHCHECK/HOME ROUTE: Fixes the failure in your screenshot
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'career-os-v2.html'));
});

// JOB HUB API: With the Japan/Pooja Fallback
app.get('/api/search', (req, res) => {
    const selectedCountry = req.query.country || 'USA';
    const searchQuery = "Postdoctoral Physiology";
    
    const countryMap = { 'Japan': 'jp', 'USA': 'us', 'India': 'in', 'Germany': 'de' };
    const supported = ['us', 'gb', 'ca', 'au', 'in', 'de', 'fr'];
    
    let apiCountry = countryMap[selectedCountry] || 'us';
    let finalQuery = searchQuery;

    if (!supported.includes(apiCountry)) {
        finalQuery = \\ \\;
        apiCountry = 'us';
    }

    res.json({ status: "success", target: apiCountry, terms: finalQuery });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is live on port ' + PORT);
});
