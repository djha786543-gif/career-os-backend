# Production Job Search Reliability: Best Practices

1. **Environment Variables:**
   - Always set required API keys (Adzuna, etc.) in Railway env vars.
   - Use a script (like `check-railway-env.js`) to verify before deploy.

2. **Error Handling:**
   - Log and surface clear errors for missing keys or API failures.
   - Return actionable error messages to the frontend.

3. **API Rate Limits:**
   - Monitor Adzuna API usage and handle rate limit errors gracefully.
   - Consider exponential backoff or retries for transient failures.

4. **Monitoring & Alerts:**
   - Use Railway logs to monitor for failed job fetches or deploys.
   - Set up alerts for repeated failures or empty job results.

5. **Dependency Management:**
   - Pin dependency versions in `package.json`.
   - For scraping, ensure Chromium is installed in Nixpacks if using Puppeteer.

6. **Testing:**
   - Test job search endpoints locally and in staging before production deploys.
   - Use mock data for local development, but never in production.

7. **Redeploy on Config Change:**
   - Always redeploy after changing environment variables or dependencies.

8. **Documentation:**
   - Keep setup and troubleshooting docs (like these) in your repo for future reference.
