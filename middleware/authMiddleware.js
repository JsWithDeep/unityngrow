// middleware/authMiddleware.js

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // User is authenticated
  }
  return res.status(401).json({ success: false, message: "Unauthorized" });
}

module.exports = { isAuthenticated };
