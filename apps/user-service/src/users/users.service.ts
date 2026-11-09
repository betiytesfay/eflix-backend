import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@app/common';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { phoneNumber: regex },
        { email: regex },
        { username: regex },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -resetToken -resetTokenExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return user;
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { role } }, { new: true })
      .select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return {
      message: `User role updated to ${role} successfully`,
      user,
    };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return {
      message: `User account deleted successfully`,
    };
  }
}
