import { Controller, Get, Patch, Post, Body, Param, HttpCode, Logger, Req, UseGuards, UploadedFile, UseInterceptors, Query, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MobileService } from './mobile.service';
import { UpdateAttendeeProfileDto, AttendeeProfileResponseDto } from './dto/attendee-profile.dto';
import { MobileMessageDto, MobileMessagesResponseDto } from './dto/mobile-message.dto';
import { ApiErrorResponse } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  @ApiOperation({ summary: 'Get current attendee profile' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendee profile',
    type: AttendeeProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
    type: ApiErrorResponse,
  })
  async getAttendeeProfile(
    @Param('eventId') eventId: string,
    @Query('email') email: string,
  ): Promise<AttendeeProfileResponseDto> {
    this.logger.debug(`Getting profile for email: ${email} in event ${eventId}`);
    const attendee = await this.mobileService.getAttendeeByEmail(eventId, email);
    return this.mobileService.getAttendeeProfile(eventId, attendee.id);
  }

  @Patch('/events/:eventId/profile')
  @ApiOperation({ summary: 'Update current attendee profile' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: AttendeeProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
    type: ApiErrorResponse,
  })
  async updateAttendeeProfile(
    @Param('eventId') eventId: string,
    @Query('email') email: string,
    @Body() dto: UpdateAttendeeProfileDto,
  ): Promise<AttendeeProfileResponseDto> {
    this.logger.debug(`Updating profile for email: ${email} in event ${eventId}`, dto);
    
    // First get the attendee by email to get the attendeeId
    const attendee = await this.mobileService.getAttendeeByEmail(eventId, email);
    
    // Now update the profile using the proper attendeeId
    return this.mobileService.updateAttendeeProfile(eventId, attendee.id, dto);
  }

  @Post('/events/:eventId/upload-documents')
  @HttpCode(200)
  @ApiOperation({ summary: 'Upload ID document for attendee' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
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

    // Extract email safely
    const email = typeof body.email === 'string' ? body.email : (Array.isArray(body.email) ? body.email[0] : '');
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    
    this.logger.debug(`Processing upload for email: ${email}`);
    return await this.mobileService.uploadDocument(eventId, email, actualFile);
  }

  @Get('/events/:eventId/mobile-messages')
  @ApiOperation({ summary: 'List mobile messages' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'List of messages',
    type: MobileMessagesResponseDto,
  })
  async getMobileMessages(
    @Param('eventId') eventId: string,
    @Query('email') email: string,
  ): Promise<MobileMessagesResponseDto> {
    console.log('=== getMobileMessages Controller DEBUG ===');
    console.log('Getting messages for email:', email, 'in event:', eventId);
    
    if (!email) {
      throw new BadRequestException('Email parameter is required');
    }
    
    // Get the attendee by email to get the attendeeId
    const attendee = await this.mobileService.getAttendeeByEmail(eventId, email);
    console.log('Found attendee:', attendee.id, 'for email:', email);
    
    return this.mobileService.getMobileMessages(eventId, attendee.id);
  }

  @Get('/events/:eventId/mobile-messages/:id')
  @ApiOperation({ summary: 'Get a specific mobile message' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message details',
    type: MobileMessageDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ApiErrorResponse,
  })
  async getMobileMessage(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<MobileMessageDto> {
    this.logger.debug(`Getting message ${id} in event ${eventId}`);
    return this.mobileService.getMobileMessage(eventId, id);
  }

  @Post('/events/:eventId/mobile-messages/:id/acknowledge')
  @HttpCode(200)
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
    status: 404,
    description: 'Message not found',
    type: ApiErrorResponse,
  })
  async acknowledgeMessage(
    @Param('id') id: string,
  ): Promise<{ ok: boolean }> {
    this.logger.debug(`Acknowledging message ${id}`);
    return this.mobileService.acknowledgeMessage(id);
  }
}