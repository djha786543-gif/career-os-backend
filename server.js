const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);
app.use(cors());
app.use(express.static(__dirname));

// Healthcheck
app.get('/health', (req, res) => res.status(200).send('OK'));

// THE REAL DATA ENGINE
app.get('/api/jobs', async (req, res) => {
    const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;
    const profile = req.query.profile || 'dj';
    
    // Default search for IT Audit / CISA
    try {
        const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/us/search/1`, {
            params: {
                app_id: ADZUNA_APP_ID,
                app_key: ADZUNA_APP_KEY,
                results_per_page: 10,
                what: "IT Audit CISA SOX",
                content_type: "application/json"
            }
        });

        // Mapping Adzuna data to your Dashboard format
        const jobs = response.data.results.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            salary: job.salary_min ? `$${Math.round(job.salary_min/1000)}k` : "N/A",
            snippet: job.description.substring(0, 150) + "...",
            applyUrl: job.redirect_url,
            postedDate: "Recent",
            fitScore: 85 // placeholder for AI scoring
        }));

        res.json({ status: 'success', jobs: jobs });
    } catch (error) {
        console.error('Adzuna Error:', error.message);
        res.status(500).json({ status: 'error', message: 'API Key or Adzuna Error' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'career-os-v2.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log('Production Engine Live on ' + PORT));
