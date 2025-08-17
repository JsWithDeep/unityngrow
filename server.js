const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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
        "https://cdn.jsdelivr.net",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      imgSrc: ["'self'", "data:", "https://placehold.co"],
      connectSrc: ["'self'"],
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
  origin: ["https://unityngrow.org", "https://ung-backend.onrender.com", "http://localhost:5000"],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
   secret: process.env.SESSION_SECRET || "dev_secret",// Replace with strong key in production
    resave: false,
    saveUninitialized: false,
    cookie: {
       secure: process.env.NODE_ENV === "production",
      httpOnly: true,
       sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 *360, // 1 day
    },
  })
);



// ---------------------------
// 8. Home route
// ---------------------------
app.get("/", (req, res) => {
  if (!req.session || !req.session.user) {
    // 🚫 Not logged in
    return res.redirect("/login.html");
  }

  // ✅ Logged in user
  if (req.session.user.isAdmin) {
    return res.sendFile(path.join(__dirname, "public", "adminDashboard.html"));
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});




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

app.use("/api/auth", authRoutes);
app.use("/", authRoutes);
app.use("/api", authRoutes);


app.use("/api/team", teamRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api", stateRoute);


//------------------------
// package routes
const packageRoutes = require('./routes/packageRoutes');
app.use('/api/buy-package', packageRoutes);

// admin routes 
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ---------------------------
// 9. Start server
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
