import { NextFunction, Request, Response } from "express";
import { z, ZodTypeAny } from "zod";

export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = z.treeifyError(result.error);
      return res.status(400).json({
        error: "Invalid request body",
        details: issues,
      });
    }

    req.body = result.data;
    next();
  };
};
