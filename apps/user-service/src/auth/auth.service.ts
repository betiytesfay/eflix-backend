import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({
      phoneNumber: dto.phoneNumber,
    });
    if (exists) {
      throw new ConflictException('Phone number already registered.');
    }

    const user = await this.userModel.create(dto);
    this.notificationClient.emit('user.created', {
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      email: user.email,
      username: user.username,
    });
    const token = this.jwtService.sign({
      userId: user._id.toString(),
      role: user.role,
    });

    return {
      message: 'User registered successfully',
      token,
      user: this.sanitize(user),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.trim();
    const user = await this.userModel.findOne(
      isEmail
        ? { email: identifier.toLowerCase() }
        : { phoneNumber: identifier },
    );
    if (!user) {
      throw new NotFoundException(
        `No accout found with this ${isEmail ? 'email' : 'phone number'}`,
      );
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    user.resetToken = hashedCode;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    this.notificationClient.emit('auth.password_reset', {
      userId: user._id.toString(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      code,
    });
    return {
      message: 'Password reset code sent successfully.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes('@');

    const hashedCode = crypto
      .createHash('sha256')
      .update(dto.code.trim())
      .digest('hex');
    const user = await this.userModel.findOne({
      ...(isEmail
        ? { email: identifier.toLowerCase() }
        : { phoneNumber: identifier }),
      resetToken: hashedCode,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired rest code');
    }
    user.password = dto.newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    return {
      message: 'Password has been reset successfully. You can now log in.',
    };
  }
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const isMatch = await user.comparePassword(dto.currentPassword);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect.');
    }
    user.password = dto.newPassword;
    await user.save();
    return {
      message: 'Password changed successfully.',
    };
  }
  async login(dto: LoginDto) {
    const rawIdentifier = dto.identifier || dto.phoneNumber;
    if (!rawIdentifier) {
      throw new UnauthorizedException('Please provide a phone number or email');
    }
    const identifier = rawIdentifier.trim();
    const isEmail = identifier.includes('@');
    const label = isEmail ? 'email' : ' phone number';
    const user = await this.userModel.findOne(
      isEmail
        ? { email: identifier.toLowerCase() }
        : { phoneNumber: identifier },
    );

    if (!user) {
      throw new UnauthorizedException(`No account found with this ${label}`);
    }
    if (!(await user.comparePassword(dto.password))) {
      throw new UnauthorizedException(`Incorrect password for this ${label}`);
    }
    const token = this.jwtService.sign({
      userId: user._id.toString(),
      role: user.role,
    });

    return {
      message: 'Login successful',
      token,
      user: this.sanitize(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
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

  private sanitize(user: User) {
    return {
      id: user._id,
      phoneNumber: user.phoneNumber,
      username: user.username,
      role: user.role,
    };
  }
}
