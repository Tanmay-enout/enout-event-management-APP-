import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { MessageDto, MessagesResponseDto } from './dto/message.dto';

@ApiTags('Messages')
@Controller('api/events/:eventId/messages')
// @UseGuards(JwtAuthGuard) // Disabled for development
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages for an event' })
  @ApiResponse({ status: 200, type: MessagesResponseDto })
  async getMessages(
    @Param('eventId') eventId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<MessagesResponseDto> {
    const messages = await this.messagesService.getMessages(eventId);
    const total = messages.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: messages.slice(start, end).map(msg => ({
        id: msg.id,
        eventId: msg.eventId,
        attendeeId: msg.attendeeId || undefined,
        inviteId: msg.inviteId || undefined, // NEW: Include inviteId
        title: msg.title,
        body: msg.body,
        attachments: msg.attachments,
        status: msg.status,
        deliveryStatus: msg.deliveryStatus || 'delivered', // NEW: Include deliveryStatus
        unread: msg.unread,
        deliveredAt: msg.deliveredAt || undefined, // NEW: Include deliveredAt
        createdAt: msg.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, type: MessageDto })
  async createMessage(
    @Param('eventId') eventId: string,
    @Body() createMessageDto: any,
  ): Promise<MessageDto> {
    try {
      const message = await this.messagesService.createMessage(eventId, createMessageDto);
      return this.transformToDto(message);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({ status: 200, type: MessageDto })
  async getMessage(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<MessageDto> {
    const message = await this.messagesService.getMessage(eventId, id);
    return this.transformToDto(message);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, type: MessageDto })
  async updateMessage(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() updateMessageDto: any,
  ): Promise<MessageDto> {
    const message = await this.messagesService.updateMessage(eventId, id, updateMessageDto);
    return this.transformToDto(message);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200 })
  async deleteMessage(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.messagesService.deleteMessage(eventId, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a message to all attendees' })
  @ApiResponse({ status: 200, type: MessageDto })
  async sendMessage(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<MessageDto> {
    const message = await this.messagesService.sendMessage(eventId, id);
    return this.transformToDto(message);
  }

  private transformToDto(message: any): MessageDto {
    return {
      id: message.id,
      eventId: message.eventId,
      attendeeId: message.attendeeId || undefined,
      inviteId: message.inviteId || undefined, // NEW: Include inviteId
      title: message.title,
      body: message.body,
      attachments: message.attachments,
      status: message.status,
      deliveryStatus: message.deliveryStatus || 'delivered', // NEW: Include deliveryStatus
      unread: message.unread,
      deliveredAt: message.deliveredAt || undefined, // NEW: Include deliveredAt
      createdAt: message.createdAt,
    };
  }
}