const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static(__dirname));

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/jobs', async (req, res) => {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const country = req.query.country ? req.query.country.toLowerCase() : 'us';
    const what = req.query.what || 'audit';
    const page = req.query.page || 1;

    if (!appId || !appKey) {
        return res.status(500).json({ status: 'error', message: 'Missing Adzuna credentials' });
    }

    try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
        const response = await axios.get(url, {
            params: {
                app_id: appId,
                app_key: appKey,
                results_per_page: 5,
                what,
                content_type: "application/json"
            }
        });

        const jobs = (response.data.results || []).map(job => ({
            id: job.id,
            title: job.title,
            company: job.company ? job.company.display_name : "N/A",
            location: job.location ? job.location.display_name : "N/A",
            salary: job.salary_min ? `$${Math.round(job.salary_min/1000)}k` : "N/A",
            snippet: job.description ? job.description.substring(0, 150) + "..." : "",
            applyUrl: job.redirect_url,
            fitScore: 92
        }));

        res.json({ status: 'success', jobs: jobs });
    } catch (error) {
        console.error('[Final Audit Error]:', error.response ? error.response.data : error.message);
        res.status(500).json({ status: 'error', message: 'Adzuna rejection', details: error.response ? error.response.data : error.message });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'career-os-v2.html')));

app.listen(PORT, '0.0.0.0', () => console.log('Audit Engine Finalized'));
