import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,

  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ phoneNumber: dto.phoneNumber });
    if (exists) {
      throw new ConflictException('Phone number already registered.');
    }

    const user = await this.userModel.create(dto);
    this.notificationClient.emit('user.created',{
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      email:user.email,
      username:user.username,
    })
    const token = this.jwtService.sign({ userId: user._id.toString(), role: user.role });

    return {
      message: 'User registered successfully',
      token,
      user: this.sanitize(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ phoneNumber: dto.phoneNumber });

    if (!user || !(await user.comparePassword(dto.password))) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    const token = this.jwtService.sign({ userId: user._id.toString(), role: user.role });

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
