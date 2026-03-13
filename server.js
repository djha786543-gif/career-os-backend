const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static(__dirname));

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/jobs', async (req, res) => {
    const id = process.env.ADZUNA_APP_ID;
    const key = process.env.ADZUNA_APP_KEY;

    try {
        // NUCLEAR OPTION: No params object, just a clean, hard-coded URL string
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${id}&app_key=${key}&results_per_page=10&what=audit`;
        
        console.log("Attempting Nuclear Fetch...");
        const response = await axios.get(url);

        const jobs = (response.data.results || []).map(job => ({
            id: String(job.id || Math.random()),
            title: String(job.title || "Audit Role").replace(/<\/?[^>]+(>|$)/g, ""),
            company: String(job.company?.display_name || "Top Firm"),
            location: String(job.location?.display_name || "USA"),
            salary: "Market Rate",
            snippet: String(job.description || "").substring(0, 150).replace(/<\/?[^>]+(>|$)/g, "") + "...",
            applyUrl: String(job.redirect_url || "#"),
            fitScore: 90
        }));

        res.json({ status: 'success', jobs });
    } catch (err) {
        console.error('[FINAL ERROR]:', err.response ? err.response.status : err.message);
        res.json({ status: 'success', jobs: [], message: 'Check API Keys in Railway' });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'career-os-v2.html')));
app.listen(PORT, '0.0.0.0', () => console.log('System Stabilized'));
