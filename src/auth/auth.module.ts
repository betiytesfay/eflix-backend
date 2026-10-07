import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';

// 🧠 WHAT IS A MODULE?
// A Module is a self-contained unit that groups related things together:
//   - controllers (handle HTTP)
//   - providers (services, strategies, guards)
//   - imports (other modules this module depends on)
//   - exports (things other modules can use from here)
//
// In Express you had NO concept of modules — everything was wired manually
// in server.ts with app.use() and imports scattered everywhere.
//
// In NestJS, every feature gets its own module. This is the foundation
// for Clean Architecture and later Microservices — each module can
// become its own service with minimal changes.
//
// 🧠 Think of it like a "feature package":
//   AuthModule packages together everything needed for authentication.
//   AppModule imports AuthModule and doesn't need to know the internals.

@Module({
  imports: [
    // 🧠 MongooseModule.forFeature()
    // Registers the User model ONLY for this module.
    // This is how @InjectModel(User.name) works in AuthService —
    // NestJS knows to inject the User mongoose model because it's registered here.
    //
    // Compare to Express: import User from '../models/User.model'
    // Here you never import the model directly — NestJS injects it.
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // 🧠 PassportModule
    // Registers Passport with NestJS. Required for @UseGuards(AuthGuard()) to work.
    PassportModule,

    // 🧠 JwtModule.registerAsync()
    // Sets up the JWT service with our secret from .env.
    // registerAsync() means "wait for ConfigService to be ready, then configure"
    // (because ConfigService reads .env, which needs to be loaded first)
    //
    // Compare to Express jwt.ts:
    //   const secret = process.env.JWT_SECRET || 'fallback'
    //   jwt.sign(payload, secret, { expiresIn: '7d' })
    //
    // Here: secret and expiry are configured ONCE in the module,
    // then JwtService.sign(payload) is called without repeating the secret everywhere.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'super_secret_jwt_key_2026',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],

  // 🧠 controllers: the HTTP handler classes for this module
  controllers: [AuthController],

  // 🧠 providers: services, strategies, guards — anything @Injectable()
  // NestJS reads this list to know what it can inject as dependencies
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
