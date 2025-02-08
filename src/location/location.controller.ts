import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { LocationService } from './location.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Location } from '../schemas/location.schemas';
import { LocationDto } from './dto/location.dto';
@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @ApiCreatedResponse({ type: Location, description: 'Create a new location' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @Post()
  async saveLocation(@Body() body: LocationDto) {
    return this.locationService.saveLocation(
      body.driverId,
      body.latitude,
      body.longitude,
    );
  }

  @ApiOkResponse({
    type: [Location],
    description: 'Retrieve all locations for the user',
  })
  @ApiBadRequestResponse({ description: 'Invalid  parameters' })
  @Get(':driverId')
  async getDriverLocations(@Param('driverId') driverId: string) {
    return this.locationService.getDriverLocations(driverId);
  }
}
