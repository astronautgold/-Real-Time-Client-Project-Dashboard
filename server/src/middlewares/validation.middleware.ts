import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error.middleware';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issueMessages = error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
        return next(new AppError(`Validation Error: ${issueMessages.join('; ')}`, 400, error.issues));
      }
      return next(error);
    }
  };
};
