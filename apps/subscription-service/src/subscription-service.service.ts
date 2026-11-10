import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionStatus,
  PlanType,
} from './schemas/subscription.schema';
import { Plan } from './schemas/plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { GuestUsage } from './schemas/guest-usage.schema';

export interface CheckAccessRequest {
  userId?: string;
  movieId: string;
  ipAddress: string;
  guestDeviceId?: string;
}

export interface CheckAccessResponse {
  hasAccess: boolean;
  planType: string;
  remainingFree: number;
  message: string;
}

@Injectable()
export class SubscriptionServiceService {
  private readonly logger = new Logger(SubscriptionServiceService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,

    @InjectModel(GuestUsage.name)
    private guestUsageModel: Model<GuestUsage>,

    @InjectModel(Plan.name)
    private planModel: Model<Plan>,
  ) {}

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const plan = await this.planModel.create(dto);
    this.logger.log(`Plan created: ${plan.name}`);
    return plan;
  }

  async getPlans(): Promise<Plan[]> {
    return this.planModel.find({
      isActive: true,
    });
  }

  async getAllPlansAdmin(): Promise<Plan[]> {
    return this.planModel.find().sort({ createdAt: -1 });
  }

  async updatePlan(planId: string, dto: Partial<CreatePlanDto>): Promise<Plan> {
    const plan = await this.planModel.findByIdAndUpdate(planId, dto, {
      new: true,
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async deletePlan(planId: string, hard = false): Promise<{ message: string }> {
    if (hard) {
      const deleted = await this.planModel.findByIdAndDelete(planId);
      if (!deleted) throw new NotFoundException('Plan not found');
      return { message: 'Plan permanently deleted' };
    }
    const plan = await this.planModel.findByIdAndUpdate(
      planId,
      { isActive: false },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Plan not found');
    return { message: 'Plan deactivated' };
  }

  async getMySubscription(userId: string) {
    const active = await this.subscriptionModel
      .findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() },
      })
      .sort({ endDate: -1 });
    return { hasActiveSubscription: !!active, subscription: active || null };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.subscriptionModel
      .findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() },
      })
      .sort({ endDate: -1 });

    if (!subscription) {
      throw new NotFoundException('No active subscription found to cancel');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.autoRenew = false;
    await subscription.save();

    this.logger.log(`Subscription cancelled for user ${userId}`);
    return {
      message: 'Subscription cancelled successfully',
      subscription,
    };
  }

  async activateFromPayment(data: {
    userId: string;
    planId: string;
    movieId?: string;
  }) {
    const plan = await this.planModel.findById(data.planId);
    if (!plan) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await this.subscriptionModel.create({
      userId: data.userId,
      plan: plan.type,
      movieId: data.movieId,
      status: SubscriptionStatus.ACTIVE,
      endDate,
    });

    this.logger.log(
      `Subscription activated for user ${data.userId}: ${plan.type}`,
    );
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const plan = await this.planModel.findOne({
      type: dto.plan,
      isActive: true,
    });
    if (!plan)
      throw new NotFoundException(`No active plan found for type: ${dto.plan}`);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await this.subscriptionModel.create({
      userId,
      plan: dto.plan,
      movieId: dto.movieId,
      status: SubscriptionStatus.ACTIVE,
      endDate,
    });

    this.logger.log(
      `Subscription created for user ${userId}: ${dto.plan} until ${endDate}`,
    );
    return subscription;
  }
  async expireOverdueSubscriptions() {
    const result = await this.subscriptionModel.updateMany(
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lte: new Date() },
      },
      {
        $set: { status: SubscriptionStatus.EXPIRED },
      },
    );

    this.logger.log(`Expired ${result.modifiedCount} overdue subscriptions.`);
    return {
      message: 'Overdue subscriptions updated to EXPIRED',
      modifiedCount: result.modifiedCount,
    };
  }
  async checkAccess(data: CheckAccessRequest): Promise<CheckAccessResponse> {
    const { userId, movieId, ipAddress, guestDeviceId } = data;

    if (userId) {
      const now = new Date();

      const activeSubscription = await this.subscriptionModel.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        plan: { $in: [PlanType.MONTHLY, PlanType.YEARLY] },
        endDate: { $gt: now },
      });

      if (activeSubscription) {
        return {
          hasAccess: true,
          planType: activeSubscription.plan,
          remainingFree: 0,
          message: 'ACCESS_GRANTED_SUBSCRIPTION',
        };
      }

      const ppvPurchase = await this.subscriptionModel.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        plan: PlanType.PAY_PER_VIEW,
        movieId,
        endDate: { $gt: now },
      });

      if (ppvPurchase) {
        return {
          hasAccess: true,
          planType: PlanType.PAY_PER_VIEW,
          remainingFree: 0,
          message: 'ACCESS_GRANTED_PAY_PER_VIEW',
        };
      }

      return {
        hasAccess: false,
        planType: 'NONE',
        remainingFree: 0,
        message: 'SUBSCRIPTION_REQUIRED',
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const identifier = guestDeviceId || ipAddress;

    let guest = await this.guestUsageModel.findOne({
      guestDeviceId: identifier,
      month: currentMonth,
    });

    if (!guest) {
      guest = await this.guestUsageModel.create({
        guestDeviceId: identifier,
        ipAddress,
        month: currentMonth,
        watchedMovies: [],
        count: 0,
      });
    }

    if (guest.watchedMovies.includes(movieId)) {
      return {
        hasAccess: true,
        planType: 'FREE_GUEST',
        remainingFree: 10 - guest.count,
        message: 'ACCESS_GRANTED_GUEST_REWATCH',
      };
    }

    if (guest.count >= 10) {
      return {
        hasAccess: false,
        planType: 'FREE_GUEST',
        remainingFree: 0,
        message: 'GUEST_LIMIT_REACHED',
      };
    }

    guest.watchedMovies.push(movieId);
    guest.count += 1;
    await guest.save();

    this.logger.log(
      `Guest (${identifier}) watched movie ${movieId}. Count: ${guest.count}/10`,
    );

    return {
      hasAccess: true,
      planType: 'FREE_GUEST',
      remainingFree: 10 - guest.count,
      message: 'ACCESS_GRANTED_GUEST',
    };
  }
}
