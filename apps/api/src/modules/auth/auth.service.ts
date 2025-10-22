import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly messagesService: MessagesService,
  ) {}

  async sendOtp(email: string): Promise<{ eventId: string; eventName?: string }> {
    console.log('AuthService.sendOtp called with email:', email, typeof email);
    
    if (!email || email.trim() === '') {
      console.error('Email parameter is empty or undefined:', email);
      throw new BadRequestException('Email is required');
    }
    
    // Check if this email exists in the invites table for ANY event
    // Following the admin flow: admin adds guests to invites table first
    console.log(`Looking for invite across all events for email: ${email}`);
    
    try {
      // Search across all events for this email
      let existingInvite = await this.prisma.invite.findFirst({
        where: {
          email: email.trim(),
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

      console.log(`Database query result for ${email} (all events):`, existingInvite);

      // If not found with exact match, try case-insensitive search across all events
      if (!existingInvite) {
        console.log(`Exact match not found, trying case-insensitive search across all events...`);
        const invites = await this.prisma.invite.findMany({
          where: {
            email: {
              mode: 'insensitive',
              equals: email.trim(),
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
        existingInvite = invites[0] || null;
        console.log(`Case-insensitive search result across all events:`, existingInvite);
      }

      if (!existingInvite) {
        console.log(`Email ${email} not found in invites table for any event`);
        throw new NotFoundException(`You are not invited to any event. Please contact the administrator to get an invitation.`);
      }

      const eventId = existingInvite.eventId;
      console.log(`Found invite for ${email} in event: ${eventId} (${existingInvite.event?.name || 'Unknown'})`);

      console.log(`Invite found for ${email} in event ${eventId}:`, {
        id: existingInvite.id,
        firstName: existingInvite.firstName,
        lastName: existingInvite.lastName,
        status: existingInvite.status,
        email: existingInvite.email,
        eventId: eventId,
        eventName: existingInvite.event?.name,
      });

      // Allow sending OTP regardless of invite status (pending, sent, etc.)
      // For development, just log the OTP
      const otp = '123456';
      console.log(`OTP for ${email}: ${otp}`);

      // Update invite's last sent time
      await this.prisma.invite.update({
        where: { id: existingInvite.id },
        data: {
          lastSentAt: new Date(),
          updatedAt: new Date(),
          status: 'sent', // Update status to 'sent' when OTP is sent
        },
      });
      console.log(`Invite updated for ${email}, status set to 'sent'`);
      
      // Return the event information so mobile app knows which event user belongs to
      return {
        eventId: eventId,
        eventName: existingInvite.event?.name,
      };
      
    } catch (error) {
      console.error(`Error in sendOtp for ${email}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process OTP request: ${error.message}`);
    }
  }

  async verifyOtp(email: string, _otp: string): Promise<boolean> {
    console.log('AuthService.verifyOtp called with email:', email);
    
    // For development, accept any OTP, but still create attendee record
    if (process.env.NODE_ENV === 'development') {
      await this.createOrUpdateAttendeeFromInvite(email);
      return true;
    }

    // In production, you would verify the actual OTP here
    await this.createOrUpdateAttendeeFromInvite(email);
    return true;
  }

  private async createOrUpdateAttendeeFromInvite(email: string): Promise<void> {
    // Find the invite across all events - use same logic as sendOtp
    let invite = await this.prisma.invite.findFirst({
      where: {
        email: email.trim(),
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

    // Fallback to case-insensitive search across all events if not found
    if (!invite) {
      const invites = await this.prisma.invite.findMany({
        where: {
          email: {
            mode: 'insensitive',
            equals: email.trim(),
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

    if (!invite) {
      console.error(`No invite found for ${email} during verification`);
      return;
    }

    const eventId = invite.eventId;
    console.log(`Creating/updating attendee for ${email} in event: ${eventId} (${invite.event?.name || 'Unknown'})`);

    // Create or update attendee record from invite
    const attendee = await this.prisma.attendee.upsert({
      where: {
        eventId_email: {
          eventId: eventId, // Use dynamic eventId from found invite
          email: email,
        },
      },
      update: {
        // Update phone verification status
        phoneVerified: true,
        derivedStatus: 'email_verified', // Email is now verified via OTP
        updatedAt: new Date(),
      },
      create: {
        eventId: eventId, // Use dynamic eventId from found invite
        email: email,
        firstName: invite.firstName || email.split('@')[0],
        lastName: invite.lastName || '',
        phone: invite.phone || null,
        countryCode: invite.countryCode || null,
        derivedStatus: 'email_verified', // Start with email verified status
        phoneVerified: true, // OTP verification counts as phone verification
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`Attendee record created/updated for ${email}:`, {
      id: attendee.id,
      derivedStatus: attendee.derivedStatus,
      phoneVerified: attendee.phoneVerified,
    });
  }

  async verifyAttendeeOtp(_eventId: string, _email: string, _otp: string): Promise<boolean> {
    // For development, accept any OTP
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return true;
  }

  async acceptInvite(email: string): Promise<void> {
    console.log('AuthService.acceptInvite called with email:', email);
    
    // Find the INVITE record across all events (not attendee!)
    let invite = await this.prisma.invite.findFirst({
      where: {
        email: email.trim(),
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

    // Fallback to case-insensitive search across all events if not found
    if (!invite) {
      const invites = await this.prisma.invite.findMany({
        where: {
          email: {
            mode: 'insensitive',
            equals: email.trim(),
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

    if (!invite) {
      console.error(`No invite found for ${email} when trying to accept invite`);
      throw new NotFoundException(`Invite not found for ${email}`);
    }

    console.log(`Found invite for ${email} in event: ${invite.eventId} (${invite.event?.name || 'Unknown'})`);

    // Update the INVITE record to mark as accepted (this is the primary action)
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: 'accepted',
        updatedAt: new Date(),
      },
    });

    console.log(`Invite accepted for ${email}, updated invite record to 'accepted' status`);

    // Optionally also update/create attendee record for tracking purposes only
    try {
      const existingAttendee = await this.prisma.attendee.findFirst({
        where: {
          email: email.trim(),
          eventId: invite.eventId,
        },
      });

      let attendeeId: string;
      
      if (existingAttendee) {
        // Update existing attendee
        await this.prisma.attendee.update({
          where: { id: existingAttendee.id },
          data: {
            acceptedAt: new Date(),
            derivedStatus: 'accepted',
            updatedAt: new Date(),
          },
        });
        attendeeId = existingAttendee.id;
        console.log(`Also updated existing attendee record for ${email}`);
      } else {
        // Create new attendee record from invite data
        const newAttendee = await this.prisma.attendee.create({
          data: {
            eventId: invite.eventId,
            email: invite.email,
            firstName: invite.firstName || email.split('@')[0],
            lastName: invite.lastName || '',
            phone: invite.phone || null,
            countryCode: invite.countryCode || null,
            derivedStatus: 'accepted',
            acceptedAt: new Date(),
            phoneVerified: true, // Since they verified OTP
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        attendeeId = newAttendee.id;
        console.log(`Created new attendee record for ${email}`);
      }

      // NEW: Deliver all queued messages for this invite
      try {
        const deliveredCount = await this.messagesService.deliverQueuedMessages(invite.id, attendeeId);
        console.log(`Delivered ${deliveredCount} queued messages for ${email}`);
      } catch (messageError) {
        console.error(`Error delivering queued messages for ${email}:`, messageError);
        // Don't throw error here as the main invite acceptance was successful
      }
    } catch (attendeeError) {
      console.error(`Error updating/creating attendee record for ${email}:`, attendeeError);
      // Don't throw error here as the main invite update was successful
    }
  }

  async login(email: string): Promise<{ access_token: string }> {
    console.log('AuthService.login called with email:', email);
    
    // Find attendee by email across all events (case-insensitive)
    let attendee = await this.prisma.attendee.findFirst({
      where: {
        email: email.trim(),
      },
    });

    // Fallback to case-insensitive search if not found
    if (!attendee) {
      const attendees = await this.prisma.attendee.findMany({
        where: {
          email: {
            mode: 'insensitive',
            equals: email.trim(),
          },
        },
      });
      attendee = attendees[0] || null;
    }

    if (!attendee) {
      throw new NotFoundException(`Attendee not found for email: ${email}`);
    }

    console.log('Found attendee for login:', { id: attendee.id, email: attendee.email });

    // Generate JWT token with proper payload for mobile authentication
    const payload = { 
      email: attendee.email, 
      sub: attendee.id, 
      type: 'mobile' 
    };
    
    const access_token = this.jwtService.sign(payload);
    
    console.log('Generated JWT token for attendee:', attendee.id);
    
    return {
      access_token,
    };
  }

  async requestPhoneOtp(phone: string, userEmail: string): Promise<void> {
    console.log('AuthService.requestPhoneOtp called with phone:', phone, 'userEmail:', userEmail);
    
    if (!phone || phone.trim() === '') {
      throw new BadRequestException('Phone number is required');
    }

    if (!userEmail || userEmail.trim() === '') {
      throw new BadRequestException('User email is required');
    }

    // Find the attendee record for this user
    const attendee = await this.prisma.attendee.findFirst({
      where: {
        email: userEmail.trim(),
      },
    });

    if (!attendee) {
      throw new BadRequestException('Attendee not found. Please complete registration first.');
    }

    // Generate a simple OTP for development (in production, use a proper SMS service)
    const otp = '123456'; // Fixed OTP for development
    
    console.log(`Phone OTP generated for ${phone}: ${otp}`);
    
    // For now, just log the OTP. In production, you would send SMS here.
    // await this.sendSms(phone, `Your verification code is: ${otp}`);
    
    // Store the OTP in Redis (similar to email OTP)
    await this.redisService.storeOtp(`phone:${userEmail}`, otp);
  }

  async verifyPhoneOtp(phone: string, code: string, userEmail: string): Promise<boolean> {
    console.log('AuthService.verifyPhoneOtp called with phone:', phone, 'code:', code, 'userEmail:', userEmail);
    
    if (!phone || phone.trim() === '') {
      throw new BadRequestException('Phone number is required');
    }

    if (!code || code.trim() === '') {
      throw new BadRequestException('OTP code is required');
    }

    if (!userEmail || userEmail.trim() === '') {
      throw new BadRequestException('User email is required');
    }

    // Verify the OTP
    const isValid = await this.redisService.verifyOtp(`phone:${userEmail}`, code);
    
    if (isValid) {
      // Update the attendee record to mark phone as verified
      await this.prisma.attendee.updateMany({
        where: {
          email: userEmail.trim(),
        },
        data: {
          phone: phone.trim(),
          phoneVerified: true,
          updatedAt: new Date(),
        },
      });
      
      console.log(`Phone verification successful for ${userEmail}`);
      return true;
    }
    
    return false;
  }
}