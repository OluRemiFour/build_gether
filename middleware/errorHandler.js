const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || "Internal Server Error"

  res.status(status).json({
    error: {
      status,
      message,
    },
  })
}

const notFound = (req, res, next) => {
  res.status(404).json({ message: "Route not found" })
}

module.exports = { errorHandler, notFound }
