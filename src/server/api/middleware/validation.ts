import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message,
      });
      return;
    }
    next();
  };
};

export default validate;
