import path from "path";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import analyzeRoutes from "./routes/analyze.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use("/api/analyze", analyzeRoutes);

// Serve static files from the React app in production
app.use(express.static(path.join(__dirname, "frontend/dist")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});