const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProduction = process.env.NODE_ENV === "production";
  const message = isProduction && statusCode >= 500 ? "Loi he thong" : err.message;

  if (statusCode >= 500) {
    console.error("server error", err.name, err.message);
  }

  const requestId = req.get("X-Request-Id") || undefined;
  res.status(statusCode).json({
    success: false,
    message,
    ...(requestId ? { requestId } : {}),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export { notFound, errorHandler };
