import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LocationService } from './location.service';
import { LocationDto } from './dto/location.dto';

@WebSocketGateway({ cors: true })
export class LocationGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly locationService: LocationService) {}

  async sendLocationUpdate(driverId: string) {
    const location = await this.locationService.getDriverLocations(driverId);
    this.server.emit(`location-update-${driverId}`, location);
  }

  @SubscribeMessage('send-location')
  async handleSendLocation(client, data: LocationDto) {
    await this.locationService.saveLocation(
      data.driverId,
      data.latitude,
      data.longitude,
    );
    this.sendLocationUpdate(data.driverId);
  }
}
