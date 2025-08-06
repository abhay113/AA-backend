const middleware = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (!error) {
      next();
    } else {
      console.log('error', error);
      res.statusCode = 400;
      let result = {
        message: "Bad request",
        errorCode: "Invalid Request",
        error: true,
        errorMessage: error.details[0].message,
        statusCode: 400,
      };

      res.send(result);
    }
  };
};

module.exports = middleware;
