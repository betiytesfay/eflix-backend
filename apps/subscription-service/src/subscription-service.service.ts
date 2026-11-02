import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionStatus, PlanType } from './schemas/subscription.schema';
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
  ) {}

  async checkAccess(data: CheckAccessRequest): Promise<CheckAccessResponse> {
    const { userId, movieId, ipAddress, guestDeviceId } = data;

    // ──────────────────────────────────────────────
    // 1. LOGGED-IN USER CHECK
    // ──────────────────────────────────────────────
    if (userId) {
      const now = new Date();

      // Check for an active Unlimited Subscription (MONTHLY or YEARLY)
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

      // Check for a Pay-Per-View pass specifically for this movie
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

      // Registered user with no active plan or rental
      return {
        hasAccess: false,
        planType: 'NONE',
        remainingFree: 0,
        message: 'SUBSCRIPTION_REQUIRED',
      };
    }

    // ──────────────────────────────────────────────
    // 2. ANONYMOUS GUEST (DEVICE + IP QUOTA)
    // ──────────────────────────────────────────────
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

    this.logger.log(`Guest (${identifier}) watched movie ${movieId}. Count: ${guest.count}/10`);

    return {
      hasAccess: true,
      planType: 'FREE_GUEST',
      remainingFree: 10 - guest.count,
      message: 'ACCESS_GRANTED_GUEST',
    };
  }
}

