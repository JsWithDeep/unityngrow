const express = require("express");

const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");
const checkSession = require('./middleware/checkSession')

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
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

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
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://placehold.co"],
      connectSrc: [
        "'self'",
        "https://unityngrow.org",
        "https://www.unityngrow.org",
        "https://unityngrow.onrender.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// ---------------------------
// 5. Middleware: Parsing & Sessions
// ---------------------------
app.use(cookieParser());




app.use(cors({
  origin: [
    "https://unityngrow.org",   // ✅ your frontend (Hostinger)
    "https://unityngrow.onrender.com", // backend itself
    "http://localhost:3000"     // dev
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Use MongoDB Store for sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: true,        // required because your site is https
    sameSite: "none",    // required for cross-site cookies
    maxAge: 1000 * 60 * 60 * 24
  }
}));
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
// 8. Protect main pages
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

// ✅ Extra: Protect index.html and adminDashboard.html if user types URL directly
app.get("/index.html", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/adminDashboard.html", (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.isAdmin) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "adminDashboard.html"));
});

// ---------------------------
// 9. Start server
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
});
