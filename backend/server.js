const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { initDb } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 4000;

initDb();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true
  })
);
app.use(express.json());

app.use("/api", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const staticRoot = path.resolve(__dirname, "../frontend/dist");
const spaIndex = path.join(staticRoot, "index.html");

if (!fs.existsSync(spaIndex)) {
  console.warn(
    "Warning: frontend/dist/index.html not found. Build the app: cd frontend && npm run build"
  );
}

app.use(express.static(staticRoot));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (!fs.existsSync(spaIndex)) {
    return res.status(503).type("text").send("Frontend build missing. Run: cd frontend && npm run build");
  }
  res.sendFile(spaIndex);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
