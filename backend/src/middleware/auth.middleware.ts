import { Request, Response, NextFunction } from "express";
import { Role, AccountStatus } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { prisma } from "../config/prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  vendorId: string | null;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new UnauthorizedError("Authentication token missing");

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, vendorId: true, name: true },
    });

    if (!user) throw new UnauthorizedError("User no longer exists");
    if (user.status !== "ACTIVE") throw new ForbiddenError("Account is not active");

    req.user = user;
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired session"));
  }
}

/** Role-based access control. Pass one or more roles allowed to access the route. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }
    next();
  };
}

/** Allows a request through if authenticated, but does not require it. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, vendorId: true, name: true },
    });
    if (user) req.user = user;
  } catch {
    // ignore — optional auth
  }
  next();
}
