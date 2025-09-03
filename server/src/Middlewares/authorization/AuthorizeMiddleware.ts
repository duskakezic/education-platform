import { Request, Response, NextFunction } from "express";

export const authorize = (...dozvoljeneUloge: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !dozvoljeneUloge.includes(user.uloga)) {
      res.status(403).json({ success: false, message: "Zabranjen pristup" });
      return;
    }

    next();
  };
};
