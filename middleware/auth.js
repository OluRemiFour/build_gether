const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  const user = await User.findById(decoded.userId).select("-password");

    // if (!user) {
    //   return res.status(401).json({ message: "User not found" });
    // }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.product_type = decoded.product_type;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    next();
  };
};

module.exports = { protect, authorize };
