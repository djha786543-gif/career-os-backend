// Script to check for required Adzuna API keys in Railway environment
// Usage: node check-railway-env.js

const requiredVars = ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"];

const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length === 0) {
  console.log("✅ All required Adzuna API keys are set.");
} else {
  console.error("❌ Missing required environment variables:", missing.join(", "));
  process.exit(1);
}
