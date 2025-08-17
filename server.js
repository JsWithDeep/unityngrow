const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");  // ✅ ADD THIS

// ---------------------------
// 1. Load environment variables
// ---------------------------
dotenv.config();

// ---------------------------
// 2. Connect to MongoDB
// ---------------------------
connectDB();

// ---------------------------
// 3. Initialize Express
// ---------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// 4. Middleware: Security
// ---------------------------
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      styleSrcElem: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      imgSrc: ["'self'", "data:", "https://placehold.co"],
      connectSrc: ["'self'", "https://ung-backend.onrender.com", "https://unityngrow.org"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// ---------------------------
// 5. Middleware: Parsing & Sessions
// ---------------------------
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "https://unityngrow.org",
      "https://ung-backend.onrender.com"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Use MongoDB Store for sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,   // ✅ persistent session store
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // ✅ works with HTTPS
      httpOnly: true,
      sameSite: "none", // ✅ required for cross-domain cookies
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ---------------------------
// 6. Static file serving
// ---------------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------------
// 7. Routes
// ---------------------------
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const stateRoute = require("./routes/stats");
const teamRoutes = require("./routes/teamRoutes");
const profileRoutes = require("./routes/profileRoutes");
const packageRoutes = require("./routes/packageRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api", stateRoute);
app.use("/api/buy-package", packageRoutes);
app.use("/api/admin", adminRoutes);

// ---------------------------
// 8. Home route
// ---------------------------
app.get("/", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login.html");
  }

  if (req.session.user.isAdmin) {
    return res.sendFile(path.join(__dirname, "public", "adminDashboard.html"));
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------------------------
// 9. Start server
// ---------------------------
app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
  );
});
