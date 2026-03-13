# Railway Environment Variable Setup for Adzuna

1. Go to your Railway project dashboard.
2. Click on the **Variables** tab.
3. Add the following environment variables (if missing):
   - `ADZUNA_APP_ID` (from developer.adzuna.com)
   - `ADZUNA_APP_KEY` (from developer.adzuna.com)
4. Redeploy your service after saving changes.

To verify locally, run:

```
node check-railway-env.js
```

If you see a ✅, your keys are set. If you see a ❌, add the missing variables.
