import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location } from '../schemas/location.schemas';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<Location>,
  ) {}

  async saveLocation(
    driverId: string,
    latitude: number,
    longitude: number,
  ): Promise<Location> {
    return await this.locationModel.create({ driverId, latitude, longitude });
  }

  async getDriverLocations(driverId: string): Promise<Location[]> {
    return await this.locationModel
      .find({ driverId })
      .sort({ createdAt: -1 })
      .limit(11);
  }
}
