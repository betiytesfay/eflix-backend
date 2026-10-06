import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// 🧠 WHAT IS A STRATEGY?
// In your Express project, you had jwt.ts with verifyToken() that you
// called manually inside the protect middleware.
//
// Passport (the auth library) introduces the concept of "strategies" —
// pluggable authentication methods. passport-jwt is the JWT strategy.
//
// This class teaches Passport HOW to validate a JWT:
//   1. WHERE to find the token → fromAuthHeaderAsBearerToken()
//      (reads "Authorization: Bearer <token>" header — same as your old middleware)
//   2. WHAT SECRET to verify with → from ConfigService (your .env JWT_SECRET)
//   3. WHAT TO DO after verification → validate() method below
//
// 🧠 WHY extends PassportStrategy(Strategy)?
// PassportStrategy is a NestJS wrapper that turns Passport's callback-based
// API into a clean NestJS injectable class. You extend it and implement validate().

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Extract the token from "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Don't accept expired tokens
      ignoreExpiration: false,
      // The same secret you used in jwt.ts signToken()
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'super_secret_jwt_key_2026',
    });
  }

  // 🧠 WHY validate()?
  // After Passport verifies the JWT signature, it calls validate() with
  // the DECODED payload (the object you passed to jwtService.sign()).
  //
  // Whatever you RETURN here gets attached to req.user automatically.
  // So req.user.userId and req.user.role will be available in controllers.
  //
  // This replaces: const decoded = verifyToken(token); req.user = decoded;
  async validate(payload: { userId: string; role: string }) {
    return { userId: payload.userId, role: payload.role };
  }
}
