import { IsString, IsOptional, IsDateString } from 'class-validator';

export const EventStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type EventStatus = typeof EventStatus[keyof typeof EventStatus];

export class CreateEventDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  timezone: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  status?: string = EventStatus.DRAFT;
}