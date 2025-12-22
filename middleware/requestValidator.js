const { validateSignupData, validateExamData } = require("./validation.js");

const validateSignup = (userType) => {
  return (req, res, next) => {
    const errors = validateSignupData(req.body, userType);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { validateSignup, requireRole };
