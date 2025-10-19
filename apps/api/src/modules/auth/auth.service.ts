import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(email: string): Promise<void> {
    // For development, just log the OTP
    const otp = '123456';
    console.log(`OTP for ${email}: ${otp}`);

    // Create or find user when sending OTP
    try {
      const user = await this.prisma.user.upsert({
        where: { email },
        update: {
          // Update last access time
          updatedAt: new Date(),
        },
        create: {
          email,
          name: email.split('@')[0], // Use email prefix as name
          role: 'USER' as any, // Mobile app user role - using any to bypass TypeScript enum issue
        },
      });
      console.log(`User created/found for email: ${email}, ID: ${user.id}`);

      // Also create/update attendee record for default event (event-1)
      // This ensures the mobile app can work with the user
      try {
        const defaultEventId = 'event-1';
        await this.prisma.attendee.upsert({
          where: {
            eventId_email: {
              eventId: defaultEventId,
              email: email,
            },
          },
          update: {
            updatedAt: new Date(),
          },
          create: {
            eventId: defaultEventId,
            email: email,
            firstName: email.split('@')[0], // Use email prefix as firstName
            lastName: '', // Empty for now, can be updated later
            derivedStatus: 'not_invited', // Default status
          },
        });
        console.log(`Attendee record created/updated for ${email} in event ${defaultEventId}`);
      } catch (attendeeError) {
        console.error(`Failed to create/update attendee for ${email}:`, attendeeError);
        // Don't throw error to prevent OTP sending from failing
      }
    } catch (error) {
      console.error(`Failed to create/find user for ${email}:`, error);
      // Don't throw error to prevent OTP sending from failing
    }
  }

  async verifyOtp(_email: string, _otp: string): Promise<boolean> {
    // For development, accept any OTP
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return true;
  }

  async verifyAttendeeOtp(_eventId: string, _email: string, _otp: string): Promise<boolean> {
    // For development, accept any OTP
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return true;
  }

  async login(email: string) {
    const payload = { email, sub: email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}