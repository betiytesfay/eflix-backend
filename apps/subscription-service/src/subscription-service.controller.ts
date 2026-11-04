import { Controller} from '@nestjs/common';
import {GrpcMethod } from '@nestjs/microservices';
import { SubscriptionServiceService , CheckAccessRequest, CheckAccessResponse} from './subscription-service.service';

@Controller()
export class SubscriptionServiceController {
  constructor(private readonly subscriptionServiceService: SubscriptionServiceService) {}
  @GrpcMethod('SubscriptionRpcService', 'CheckAccess')
  async checkAccess(data: CheckAccessRequest): Promise<CheckAccessResponse>{
    return this.subscriptionServiceService.checkAccess(data); 
  }

  
}
