import express, { Request, Response } from 'express';
import powerdns from '../services/powerdns';
import validators from '../validators';
import validate from '../middleware/validation';
import authenticate from '../middleware/auth';
import logger from '../config/logger';
import { RegisterRequest } from '../types';

const router = express.Router();

router.post(
  '/register',
  authenticate,
  validate(validators.register),
  async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    const { name, uri } = req.body;

    try {
      const existingRecord = await powerdns.getTXTRecord(name);
      if (existingRecord) {
        res.status(409).json({
          error: 'Name already registered',
          fqdn: existingRecord.fqdn,
        });
        return;
      }

      const result = await powerdns.addTXTRecord(name, uri);
      logger.info('Name registered', { name, fqdn: result.fqdn });

      res.status(201).json({
        message: 'Name registered successfully',
        fqdn: result.fqdn,
        uri: result.uri,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Registration failed', { name, error: message });
      res.status(500).json({ error: message });
    }
  }
);

router.get('/record/:name', async (req: Request<{ name: string }>, res: Response) => {
  const { name } = req.params;

  const { error } = validators.name.validate(name);
  if (error) {
    res.status(400).json({
      error: 'Invalid name format',
      details: error.details[0].message,
    });
    return;
  }

  try {
    const record = await powerdns.getTXTRecord(name);

    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to retrieve record', { name, error: message });
    res.status(500).json({ error: message });
  }
});

export default router;
