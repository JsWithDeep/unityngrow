// middleware/checkSession.js
function checkSession(req, res, next) {
  if (!req.session.user) {
    // If not logged in, redirect to login page
    return res.redirect("/login.html");
  }
  next();
}

module.exports = checkSession;
