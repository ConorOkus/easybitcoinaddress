import Joi from 'joi';

const validators = {
  register: Joi.object({
    name: Joi.string()
      .pattern(/^[a-z0-9]+$/)
      .max(64)
      .required()
      .messages({
        'string.pattern.base': 'Name must contain only lowercase letters and numbers',
        'string.max': 'Name must not exceed 64 characters',
      }),
    uri: Joi.string()
      .pattern(/^bitcoin:/)
      .required()
      .messages({
        'string.pattern.base': 'URI must start with "bitcoin:"',
      }),
  }),

  name: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .max(64)
    .required(),
};

export default validators;
