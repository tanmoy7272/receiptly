import { HTTP_STATUS } from '../constants/index.js';

export const errorHandler = (err, req, res, next) => {
  const reqId = req.id || 'N/A';

  // Handle Zod Validation Errors cleanly
  if (err.name === 'ZodError') {
    const message = err.errors[0]?.message || 'Validation error';
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
      error: {
        message,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      },
    });
  }

  // Handle Multer Upload Errors cleanly (e.g. File too large)
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The selected file exceeds the 10MB size limit. Please choose a smaller file.'
      : err.message || 'File upload error.';
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
      error: {
        message,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      },
    });
  }

  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isProduction = process.env.NODE_ENV === 'production';

  const userMessage =
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && isProduction
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message: userMessage,
    error: {
      message: userMessage,
      statusCode,
    },
    errors: [{ message: userMessage }],
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
