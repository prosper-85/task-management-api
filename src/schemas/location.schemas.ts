import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Location extends Document {
  @ApiProperty()
  @Prop({ required: true })
  driverId: string;

  @ApiProperty()
  @Prop({ required: true })
  latitude: number;

  @ApiProperty()
  @Prop({ required: true })
  longitude: number;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
