import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAttendeeProfileDto, AttendeeProfileResponseDto } from './dto/attendee-profile.dto';
import { MobileMessageDto, MobileMessagesResponseDto } from './dto/mobile-message.dto';

@Injectable()
export class MobileService {
  private readonly logger = new Logger(MobileService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapAttendeeToDto(attendee: any): AttendeeProfileResponseDto {
    return {
      id: attendee.id,
      eventId: attendee.eventId,
      email: attendee.email,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      phone: attendee.phone,
      workEmail: attendee.workEmail,
      location: attendee.location,
      gender: attendee.gender,
      dietaryRequirements: attendee.dietaryRequirements,
      acceptedAt: attendee.acceptedAt,
      tasksJson: attendee.tasksJson,
      idDocUrl: attendee.idDocUrl,
      // Always return false for phoneVerified to force mobile app to use OTP verification
      // Mobile app uses local storage flag 'user_verified_phone' to determine completion status
      // This ensures phone verification only happens through proper mobile OTP flow
      phoneVerified: false,
      createdAt: attendee.createdAt,
      updatedAt: attendee.updatedAt,
    };
  }

  private mapMessageToDto(message: any): MobileMessageDto {
    return {
      id: message.id,
      eventId: message.eventId,
      attendeeId: message.attendeeId,
      title: message.title,
      body: message.body,
      attachments: message.attachments,
      unread: message.unread,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  async getAttendeeProfile(eventId: string, attendeeId: string): Promise<AttendeeProfileResponseDto> {
    this.logger.debug(`Fetching attendee profile: ${attendeeId} for event: ${eventId}`);
    
    const attendee = await this.prisma.attendee.findFirst({
      where: { id: attendeeId, eventId },
    });

    if (!attendee) {
      this.logger.warn(`Attendee not found: ${attendeeId} for event: ${eventId}`);
      throw new NotFoundException(`Attendee not found`);
    }

    return this.mapAttendeeToDto(attendee);
  }

  async updateAttendeeProfile(
    eventId: string,
    attendeeId: string,
    dto: UpdateAttendeeProfileDto,
  ): Promise<AttendeeProfileResponseDto> {
    this.logger.debug(`Updating attendee profile: ${attendeeId} for event: ${eventId}`, dto);

    // First verify the attendee exists with the given attendeeId and eventId
    const attendee = await this.prisma.attendee.findFirst({
      where: { id: attendeeId, eventId },
    });

    if (!attendee) {
      this.logger.warn(`Attendee not found with ID: ${attendeeId} for event: ${eventId}`);
      throw new NotFoundException(`Attendee not found`);
    }

    // Update the attendee with the provided data
    const updated = await this.prisma.attendee.update({
      where: { id: attendeeId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        workEmail: dto.workEmail,
        location: dto.location,
        gender: dto.gender,
        dietaryRequirements: dto.dietaryRequirements,
        updatedAt: new Date(),
      },
    });

    return this.mapAttendeeToDto(updated);
  }

  async getMobileMessages(eventId: string, attendeeId?: string): Promise<MobileMessagesResponseDto> {
    console.log('=== getMobileMessages DEBUG ===');
    console.log('EventId:', eventId);
    console.log('AttendeeId:', attendeeId);
    
    // Only show delivered messages to mobile users (queued messages are not visible until delivered)
    const whereClause = { 
      eventId, 
      deliveryStatus: 'delivered', // NEW: Only show delivered messages
      ...(attendeeId ? { attendeeId } : {}) 
    };
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const [messages, total] = await Promise.all([
      this.prisma.mobileMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mobileMessage.count({
        where: whereClause,
      }),
    ]);

    console.log(`Found ${messages.length} messages for attendee ${attendeeId}`);
    console.log('Messages:', messages.map(m => ({
      id: m.id,
      attendeeId: m.attendeeId,
      title: m.title,
      unread: m.unread
    })));

    return {
      data: messages.map(this.mapMessageToDto),
      total,
      page: 1,
      pageSize: messages.length,
      totalPages: 1,
    };
  }

  async getMobileMessage(eventId: string, messageId: string): Promise<MobileMessageDto> {
    this.logger.debug(`Fetching mobile message: ${messageId} for event: ${eventId}`);

    const message = await this.prisma.mobileMessage.findFirst({
      where: { id: messageId, eventId },
    });

    if (!message) {
      this.logger.warn(`Message not found: ${messageId} for event: ${eventId}`);
      throw new NotFoundException(`Message not found`);
    }

    return this.mapMessageToDto(message);
  }

  async acknowledgeMessage(messageId: string): Promise<{ ok: boolean }> {
    this.logger.debug(`Acknowledging message: ${messageId}`);

    const message = await this.prisma.mobileMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      this.logger.warn(`Message not found: ${messageId}`);
      throw new NotFoundException(`Message not found`);
    }

    await this.prisma.mobileMessage.update({
      where: { id: messageId },
      data: { unread: false },
    });

    return { ok: true };
  }

  // Helper method to get attendee by email - creates if doesn't exist
  async getAttendeeByEmail(eventId: string, email: string) {
    try {
      // Ensure email is a string
      const emailStr: string = typeof email === 'string' ? email.trim() : String(email).trim();
      this.logger.debug(`Finding attendee by email: ${emailStr} for event: ${eventId}`);

      // First try exact match
      let attendee = await this.prisma.attendee.findFirst({
        where: {
          email: emailStr,
          eventId: eventId,
        },
      });

    // If not found, try case-insensitive search
    if (!attendee) {
      const attendees = await this.prisma.attendee.findMany({
        where: {
          eventId: eventId,
          email: {
            mode: 'insensitive',
            equals: emailStr,
          },
        },
      });
      attendee = attendees[0] || null;
    }

    // If still not found, try to create from invite
    if (!attendee) {
      this.logger.debug(`Attendee not found, checking for invite for email: ${email} in event: ${eventId}`);
      
      // First try to find invite in the specified event
      let invite = await this.prisma.invite.findFirst({
        where: {
          email: emailStr,
          eventId: eventId,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // If not found, try case-insensitive search in the specified event
      if (!invite) {
        const invites = await this.prisma.invite.findMany({
          where: {
            eventId: eventId,
            email: {
              mode: 'insensitive',
              equals: emailStr,
            },
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        invite = invites[0] || null;
      }

      // If still not found in the specified event, search across ALL events (like auth service)
      if (!invite) {
        this.logger.debug(`No invite found in event ${eventId}, searching across all events for email: ${email}`);
        invite = await this.prisma.invite.findFirst({
          where: {
            email: emailStr,
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // If still not found, try case-insensitive search across all events
        if (!invite) {
          const invites = await this.prisma.invite.findMany({
            where: {
              email: {
                mode: 'insensitive',
                equals: emailStr,
              },
            },
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
          invite = invites[0] || null;
        }
      }

      if (!invite) {
        this.logger.warn(`No invite found for email: ${email} in any event`);
        throw new NotFoundException(`No invite found for email: ${email}. Please ensure you have been invited to an event.`);
      }

      // Use the invite's eventId (which might be different from the requested eventId)
      const actualEventId = invite.eventId;
      this.logger.debug(`Found invite for email: ${email} in event: ${actualEventId} (requested: ${eventId})`);

      // Try to create attendee in the REQUESTED event first, not the invite's event
      this.logger.debug(`Creating attendee for email: ${email} in requested event: ${eventId}`);
      
      // Check if attendee already exists in the requested event
      const existingAttendeeInRequestedEvent = await this.prisma.attendee.findFirst({
        where: {
          email: emailStr,
          eventId: eventId, // Use the requested eventId, not invite's eventId
        },
      });

      if (existingAttendeeInRequestedEvent) {
        this.logger.debug(`Attendee already exists for ${email} in requested event ${eventId}, using existing`);
        attendee = existingAttendeeInRequestedEvent;
      } else {
        // Create attendee in the requested event using invite data
        this.logger.debug(`Creating new attendee from invite for email: ${email} in requested event: ${eventId}`);
        attendee = await this.prisma.attendee.create({
          data: {
            eventId: eventId, // Use the requested eventId
            email: emailStr,
            firstName: invite.firstName || email.split('@')[0],
            lastName: invite.lastName || '',
            phone: invite.phone || null,
            countryCode: invite.countryCode || null,
            derivedStatus: 'email_verified', // Assume email verified since they're accessing the app
            phoneVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      
      this.logger.debug(`Created/new attendee: ${attendee.id} for email: ${email} in event: ${eventId}`);
    }

    return attendee;
    } catch (error) {
      this.logger.error(`Error in getAttendeeByEmail for ${email}:`, error);
      throw error;
    }
  }

  // Upload document for attendee
  async uploadDocument(eventId: string, email: string, file: any) {
    this.logger.debug(`Uploading document for email: ${email} in event: ${eventId}`);
    this.logger.debug(`File details - type: ${typeof file}, hasFile: ${!!file}, originalname: ${file?.originalname || 'undefined'}, filename: ${file?.filename || 'undefined'}`);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const attendee = await this.getAttendeeByEmail(eventId, email);

    // Validate attendee object
    if (!attendee || !attendee.id) {
      throw new BadRequestException('Invalid attendee record');
    }

    // Generate a safe filename - handle different file object structures
    const originalName = file.originalname || file.filename || file.name || 'document.pdf';
    const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const finalFileName = `${timestamp}_${safeFileName}`;

    const idDocUrl = `/uploads/attendees/${String(attendee.id)}/${finalFileName}`;
    const uploadDir = `./uploads/attendees/${String(attendee.id)}`;
    
    this.logger.debug(`Generated file URL: ${idDocUrl}`);

    try {
      // ADDED: Import fs for file operations
      const fs = require('fs').promises;
      
      // Create directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Write file to disk - handle React Native file objects
      const filePath = `${uploadDir}/${finalFileName}`;
      
      // Check if file has buffer (Node.js file) or needs to be read differently (React Native)
      if (file.buffer) {
        // Standard Node.js file with buffer
        await fs.writeFile(filePath, file.buffer);
      } else if (file.uri || file.path) {
        // React Native file - read from URI/path
        const fileData = await fs.readFile(file.uri || file.path);
        await fs.writeFile(filePath, fileData);
      } else {
        // Fallback: try to write the file object directly
        await fs.writeFile(filePath, file);
      }
      
      this.logger.debug(`File written to: ${filePath}`);

      // Update the attendee record with the document URL
      await this.prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          idDocUrl: idDocUrl,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Document uploaded successfully for ${email}: ${idDocUrl}`);

      return {
        ok: true,
        message: 'Document uploaded successfully',
        idDocUrl: idDocUrl,
      };
    } catch (error) {
      this.logger.error(`Error updating attendee record for ${email}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to update attendee record: ${errorMessage}`);
    }
  }

  async getEventDetails(eventId: string) {
    this.logger.debug(`Fetching event details for: ${eventId}`);
    
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        location: true,
        timezone: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      timezone: event.timezone,
      status: event.status,
    };
  }

}