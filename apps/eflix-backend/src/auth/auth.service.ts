import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// 🧠 WHAT IS A SERVICE?
// In your Express project, the controller did EVERYTHING:
//   - read the request body
//   - query the database
//   - create the JWT
//   - send the response
//
// NestJS splits this into two responsibilities:
//   Controller → handles HTTP (reads request, sends response)
//   Service    → handles BUSINESS LOGIC (DB, JWT, rules)
//
// This matches the Single Responsibility Principle (S in SOLID).
// It also makes testing easy — you can test AuthService without
// spinning up an HTTP server at all.
//
// 🧠 WHY @Injectable()?
// This decorator tells NestJS's DI container:
// "This class can be injected into other classes as a dependency."
// Without it, NestJS can't inject it into the controller.

@Injectable()
export class AuthService {
  // 🧠 WHY constructor injection?
  // NestJS reads the constructor parameter types and automatically
  // provides the right instances — you never call "new AuthService()" yourself.
  //
  // @InjectModel(User.name) → gives us the Mongoose Model for User
  //   replaces: import User from '../models/User.model'
  //
  // JwtService → NestJS's JWT wrapper (configured in AuthModule)
  //   replaces: import { signToken, verifyToken } from '../utils/jwt'
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  // ──────────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────────
  // 🧠 Compare to your Express register():
  //   - No req/res params — just the DTO (already validated by NestJS)
  //   - No manual res.status(409) — throw ConflictException instead
  //     NestJS's exception filter catches it and returns the right HTTP status
  //   - Returns the data directly — NestJS serializes it to JSON automatically
  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ phoneNumber: dto.phoneNumber });
    if (exists) {
      // 🧠 ConflictException → NestJS sends 409 automatically
      throw new ConflictException('Phone number already registered.');
    }

    const user = await this.userModel.create(dto);

    // 🧠 this.jwtService.sign() replaces your signToken() utility
    const token = this.jwtService.sign({ userId: user._id.toString(), role: user.role });

    return {
      message: 'User registered successfully',
      token,
      user: this.sanitize(user),
    };
  }

  // ──────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ phoneNumber: dto.phoneNumber });

    if (!user || !(await user.comparePassword(dto.password))) {
      // 🧠 UnauthorizedException → NestJS sends 401 automatically
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    const token = this.jwtService.sign({ userId: user._id.toString(), role: user.role });

    return {
      message: 'Login successful',
      token,
      user: this.sanitize(user),
    };
  }

  // ──────────────────────────────────────────────
  // GET ME
  // ──────────────────────────────────────────────
  // 🧠 userId comes from req.user.userId (set by JwtStrategy.validate())
  // The controller extracts it and passes it here — service stays HTTP-agnostic
  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
      // 🧠 NotFoundException → NestJS sends 404 automatically
      throw new NotFoundException('User not found.');
    }

    return {
      message: 'User profile fetched successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        email: user.email,
        telegramAccount: user.telegramAccount,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // ──────────────────────────────────────────────
  // HELPER
  // ──────────────────────────────────────────────
  // Strips sensitive fields before returning user in responses
  private sanitize(user: User) {
    return {
      id: user._id,
      phoneNumber: user.phoneNumber,
      username: user.username,
      role: user.role,
    };
  }
}
