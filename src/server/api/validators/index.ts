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
      .custom((value, helpers) => {
        // Additional validation for BOLT 12 offers
        if (value.includes('?lno=') || value.includes('&lno=')) {
          const lnoMatch = value.match(/[?&]lno=([^&]*)/);
          if (lnoMatch) {
            const lnoValue = lnoMatch[1];
            if (!lnoValue || !lnoValue.startsWith('lno1')) {
              return helpers.error('custom.invalidBolt12');
            }
          }
        }
        return value;
      })
      .required()
      .messages({
        'string.pattern.base': 'URI must start with "bitcoin:"',
        'custom.invalidBolt12': 'BOLT 12 offer must start with "lno1"',
      }),
  }),

  name: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .max(64)
    .required(),
};

export default validators;
