/**
 * Zod Validation Middleware
 * Validates request body/params/query against Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      const validated = schema.parse(data);

      // Replace original data with validated data
      if (source === 'body') req.body = validated;
      else if (source === 'params') req.params = validated as any;
      else req.query = validated as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      // Never leak internal errors
      return res.status(400).json({
        error: 'Invalid request data',
      });
    }
  };
};
