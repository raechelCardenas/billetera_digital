export const successResponse = (code, message, data) => {
  const payload = {
    success: true,
    code,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return payload;
};

export const errorResponse = (code, message, errors) => {
  const payload = {
    success: false,
    code,
    message,
    data: null,
  };

  if (Array.isArray(errors) && errors.length > 0) {
    payload.errors = errors;
  }

  return payload;
};
