import { Controller, Get, Patch, Post, Body, Param, HttpCode, Logger, UseGuards, UploadedFile, UseInterceptors, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MobileService } from './mobile.service';
import { UpdateAttendeeProfileDto, AttendeeProfileResponseDto } from './dto/attendee-profile.dto';
import { MobileMessageDto, MobileMessagesResponseDto } from './dto/mobile-message.dto';
import { ApiErrorResponse } from '../../common/dto/api-response.dto';
import { MobileJwtAuthGuard } from '../auth/guards/mobile-jwt-auth.guard';
import { MobileUser } from '../auth/decorators/mobile-user.decorator';
import { Attendee } from '@prisma/client';

@ApiTags('mobile')
@Controller()
export class MobileController {
  private readonly logger = new Logger(MobileController.name);
  private readonly TEST_ATTENDEE_ID = 'cmgeqhtvn0001gsqbownyjgmr';

  constructor(private readonly mobileService: MobileService) {}

  @Get('/events/:eventId')
  @ApiOperation({ summary: 'Get event details for mobile' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event details',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
    type: ApiErrorResponse,
  })
  async getEventDetails(@Param('eventId') eventId: string) {
    this.logger.debug(`Getting event details for: ${eventId}`);
    return this.mobileService.getEventDetails(eventId);
  }

  @Get('/events/:eventId/profile')
  @UseGuards(MobileJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current attendee profile' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendee profile',
    type: AttendeeProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
    type: ApiErrorResponse,
  })
  async getAttendeeProfile(
    @Param('eventId') eventId: string,
    @MobileUser() attendee: Attendee,
  ): Promise<AttendeeProfileResponseDto> {
    console.log('=== getAttendeeProfile Controller ===');
    console.log('EventId:', eventId);
    console.log('Attendee:', attendee ? { id: attendee.id, email: attendee.email } : 'none');
    this.logger.debug(`Getting profile for attendee: ${attendee?.id} in event ${eventId}`);
    
    if (!attendee) {
      throw new UnauthorizedException('No attendee found in request');
    }
    
    return this.mobileService.getAttendeeProfile(eventId, attendee.id);
  }

  @Patch('/events/:eventId/profile')
  @UseGuards(MobileJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current attendee profile' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: AttendeeProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
    type: ApiErrorResponse,
  })
  async updateAttendeeProfile(
    @Param('eventId') eventId: string,
    @MobileUser() attendee: Attendee,
    @Body() dto: UpdateAttendeeProfileDto,
  ): Promise<AttendeeProfileResponseDto> {
    this.logger.debug(`Updating profile for attendee: ${attendee.id} in event ${eventId}`, dto);
    
    // Now update the profile using the authenticated attendee's ID
    return this.mobileService.updateAttendeeProfile(eventId, attendee.id, dto);
  }

  @Post('/events/:eventId/upload-documents')
  @HttpCode(200)
  @UseGuards(MobileJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload ID document for attendee' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
    type: ApiErrorResponse,
  })
  @UseInterceptors(FileInterceptor('document', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, callback) => {
      // Accept all files for now, can add type validation later
      callback(null, true);
    }
  }))
  async uploadDocument(
    @Param('eventId') eventId: string,
    @UploadedFile() file: any,
    @Body() body: any,
    @MobileUser() attendee: Attendee,
  ): Promise<{ ok: boolean; message: string; idDocUrl?: string }> {
    try {
      this.logger.debug(`Upload request - hasFile: ${!!file}, hasBody: ${!!body}`);
    } catch (logError) {
      this.logger.debug(`Upload request - hasFile: ${!!file}`);
    }
    
    // Handle React Native file uploads - sometimes the file comes through the body instead of @UploadedFile()
    let actualFile = file;
    
    if (!actualFile && body.document) {
      this.logger.debug('File not in @UploadedFile(), checking body.document');
      actualFile = Array.isArray(body.document) ? body.document[0] : body.document;
    }
    
    if (!actualFile) {
      this.logger.error('No file found in request');
      throw new BadRequestException('No file uploaded. Please ensure you are sending a file with the field name "document".');
    }
    
    this.logger.debug(`Processing upload for attendee: ${attendee.id}`);
    return await this.mobileService.uploadDocument(eventId, attendee.email, actualFile);
  }

  @Get('/events/:eventId/mobile-messages')
  @UseGuards(MobileJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List mobile messages' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'List of messages',
    type: MobileMessagesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponse,
  })
  async getMobileMessages(
    @Param('eventId') eventId: string,
    @MobileUser() attendee: Attendee,
  ): Promise<MobileMessagesResponseDto> {
    console.log('=== getMobileMessages Controller DEBUG ===');
    console.log('Getting messages for attendee:', attendee.id, 'in event:', eventId);
    
    return this.mobileService.getMobileMessages(eventId, attendee.id);
  }

  @Get('/events/:eventId/mobile-messages/:id')
  @UseGuards(MobileJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific mobile message' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message details',
    type: MobileMessageDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ApiErrorResponse,
  })
  async getMobileMessage(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @MobileUser() attendee: Attendee,
  ): Promise<MobileMessageDto> {
    this.logger.debug(`Getting message ${id} in event ${eventId} for attendee ${attendee.id}`);
    return this.mobileService.getMobileMessage(eventId, id);
  }

  @Post('/events/:eventId/mobile-messages/:id/acknowledge')
  @HttpCode(200)
  @UseGuards(MobileJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read',
    schema: {
      type: 'object',
      properties: {
        ok: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ApiErrorResponse,
  })
  async acknowledgeMessage(
    @Param('id') id: string,
    @MobileUser() attendee: Attendee,
  ): Promise<{ ok: boolean }> {
    this.logger.debug(`Acknowledging message ${id} for attendee ${attendee.id}`);
    return this.mobileService.acknowledgeMessage(id);
  }
}