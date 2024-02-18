const response = (statusCode, data, res, message, pagination = false) => {
  if (pagination) {
    res.status(statusCode).json([
      {
        code: statusCode,
        status: statusCode != 200 ? "NO OKAY" : "OKAY",
        message: message,

        pagination: {
          skip: 0,
          limit: 20,
        },
      },
      [
        {
          data: data,
        },
      ],
    ]);
  } else {
    res.status(statusCode).json([
      {
        code: statusCode,
        status: statusCode != 200 ? "NO OKAY" : "OKAY",
        message: message,
      },
      {
        data: data,
      },
    ]);
  }
};

module.exports = response;
