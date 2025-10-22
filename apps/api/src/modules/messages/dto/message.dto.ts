import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Event ID' })
  eventId: string;

  @ApiPropertyOptional({ description: 'Attendee ID' })
  attendeeId?: string;

  @ApiPropertyOptional({ description: 'Invite ID (for queued messages)' })
  inviteId?: string;

  @ApiProperty({ description: 'Message title' })
  title: string;

  @ApiProperty({ description: 'Message body' })
  body: string;

  @ApiPropertyOptional({ description: 'Message attachments' })
  attachments?: any;

  @ApiProperty({ description: 'Message status' })
  status: string;

  @ApiProperty({ description: 'Delivery status (queued/delivered)' })
  deliveryStatus: string;

  @ApiProperty({ description: 'Unread status' })
  unread: boolean;

  @ApiPropertyOptional({ description: 'Delivered at timestamp' })
  deliveredAt?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;
}

export class MessagesResponseDto {
  @ApiProperty({ type: [MessageDto] })
  data: MessageDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}