import { apiError } from '../utils/api.util.js';
import { CUSTOM_ERROR } from '../utils/message.util.js';
import { populateMessage } from '../utils/validator.util.js';

export const validate = (schema, type) => (req, res, next) => {
  if (req[type] === undefined) {
    return apiError(CUSTOM_ERROR, `${type} is missing from request`, null, res);
  }

  const { error } = schema.validate(req[type]);

  if (error) {
    return apiError(CUSTOM_ERROR, populateMessage(error), null, res);
  }

  next();
};

export const validateMultiple = (schema, types) => (req, res, next) => {
  if (!Array.isArray(types) || types.length === 0) {
    return apiError(CUSTOM_ERROR, "Validation types must be a non-empty array", null, res);
  }
  const validationData = {};
  types.forEach((type) => {
    validationData[type] = req[type];
  });
  const { error } = schema.validate(validationData);
  if (error) {
    return apiError(CUSTOM_ERROR, populateMessage(error), null, res);
  }
  next();
};
