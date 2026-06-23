import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

type ZodSchemaLike = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidationSchemas {
  body?: ZodSchemaLike;
  query?: ZodSchemaLike;
  params?: ZodSchemaLike;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Invalid request body', result.error.flatten().fieldErrors);
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw new ValidationError('Invalid query parameters', result.error.flatten().fieldErrors);
      }
      req.query = result.data as typeof req.query;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw new ValidationError('Invalid path parameters', result.error.flatten().fieldErrors);
      }
      req.params = result.data as typeof req.params;
    }

    next();
  };
}
