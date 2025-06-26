import { Request, Response, NextFunction } from 'express';
import config from '../config/config';

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);

  if (token !== config.auth.token) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }

  next();
};

export default authenticate;
