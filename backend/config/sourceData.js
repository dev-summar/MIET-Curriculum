const fs = require("fs");
const path = require("path");

/**
 * Canonical curriculum seed: `backend/data/curriculum.seed.json`
 * (generated from legacy HTML once; edit JSON or use admin API + re-seed).
 */
function loadSourceData() {
  const jsonPath = path.join(__dirname, "../data/curriculum.seed.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `Missing ${jsonPath}. Restore from repo or run: cd backend && npm run seed (after placing curriculum.seed.json).`
    );
  }
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw);
}

module.exports = { loadSourceData };
