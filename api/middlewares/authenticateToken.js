const jwt = require("jsonwebtoken");
const config = require("../config");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  console.log(token);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Attach the decoded user information to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

function verifyAdminRole(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

module.exports = {
  authenticateToken,
  verifyAdminRole,
};
