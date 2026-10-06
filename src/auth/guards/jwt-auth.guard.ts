import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 🧠 WHAT IS A GUARD?
// A Guard is NestJS's replacement for auth middleware.
//
// In Express you had this in auth.middleware.ts:
//   export const protect = (req, res, next) => { ... verify token ... next() }
// And applied it like:
//   authRouter.get('/me', protect, getMe)
//
// In NestJS, AuthGuard('jwt') tells Passport:
//   "Run the 'jwt' strategy before this route"
// The 'jwt' string matches the strategy name — and since we extended
// PassportStrategy(Strategy) without a custom name, it defaults to 'jwt'.
//
// If the JWT is invalid → Guard returns 401 automatically (no manual res.status(401))
// If the JWT is valid   → req.user is populated, route handler runs
//
// 🧠 WHY extend AuthGuard instead of implementing from scratch?
// @nestjs/passport's AuthGuard() gives you the Passport integration for free.
// You can override canActivate() to add custom logic if needed later.

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
