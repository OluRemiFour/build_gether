const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ✅ For exams (unchanged, but cleaned up a bit)
const validateExamData = (data) => {
  const errors = [];
  const {
    title,
    description,
    startDate,
    endDate,
    duration,
    totalQuestions,
    totalMarks,
    passingMarks,
  } = data;

  if (!title) errors.push("Title is required");
  if (!description) errors.push("Description is required");
  if (!startDate) errors.push("Start date is required");
  if (!endDate) errors.push("End date is required");
  if (!duration || duration <= 0) errors.push("Valid duration is required");
  if (!totalQuestions || totalQuestions <= 0)
    errors.push("Total questions must be greater than 0");
  if (!totalMarks || totalMarks <= 0)
    errors.push("Total marks must be greater than 0");
  if (passingMarks > totalMarks)
    errors.push("Passing marks cannot exceed total marks");

  return errors;
};

module.exports = { validateExamData, validateEmail, validatePassword };
