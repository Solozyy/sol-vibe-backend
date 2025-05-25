import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Membership, MembershipDocument } from './schemas/membership.schema';
import { UsersService } from '../users/users.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    private usersService: UsersService,
  ) {}

  async subscribe(subscriberUserId: string, subscribeDto: SubscribeDto): Promise<Membership> {
    const { creatorUserId } = subscribeDto;

    if (subscriberUserId === creatorUserId) {
      throw new BadRequestException('Users cannot subscribe to themselves.');
    }

    // Check if creator user exists
    const creatorUser = await this.usersService.findById(creatorUserId);
    if (!creatorUser) {
      throw new NotFoundException(`Creator user with ID "${creatorUserId}" not found.`);
    }
    // Subscriber user is implicitly checked by JwtAuthGuard (existence)

    const existingSubscription = await this.membershipModel.findOne({
      subscriberUser: new Types.ObjectId(subscriberUserId),
      creatorUser: new Types.ObjectId(creatorUserId),
    });

    if (existingSubscription) {
      throw new ConflictException('User is already subscribed to this creator.');
    }

    const newSubscription = new this.membershipModel({
      subscriberUser: new Types.ObjectId(subscriberUserId),
      creatorUser: new Types.ObjectId(creatorUserId),
    });

    return newSubscription.save();
  }

  async isMember(subscriberUserId: string, creatorUserId: string): Promise<boolean> {
    if (!subscriberUserId || !creatorUserId) return false;
    const subscription = await this.membershipModel.findOne({
      subscriberUser: new Types.ObjectId(subscriberUserId),
      creatorUser: new Types.ObjectId(creatorUserId),
    });
    return !!subscription;
  }

  async getSubscribedCreatorIds(subscriberUserId: string): Promise<Types.ObjectId[]> {
    const subscriptions = await this.membershipModel.find(
      { subscriberUser: new Types.ObjectId(subscriberUserId) },
      { creatorUser: 1, _id: 0 } // Projection to only get creatorUser IDs
    ).lean(); // .lean() for performance if you don't need Mongoose documents
    return subscriptions.map(sub => sub.creatorUser);
  }
}
