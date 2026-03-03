const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Format is "Bearer <token>"

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach user info (id, role) to the request
    next(); // Pass control to the next function (the controller)
  } catch (err) {
    res.status(401).json({ message: "Invalid or Expired Token" });
  }
};

module.exports = verifyToken;