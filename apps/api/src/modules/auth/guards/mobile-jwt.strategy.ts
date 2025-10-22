import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MobileJwtStrategy extends PassportStrategy(Strategy, 'mobile-jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-jwt-secret-key',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    console.log('=== MobileJwtStrategy validate ===');
    console.log('Payload received:', JSON.stringify(payload, null, 2));
    
    // Validate payload type for mobile (but be more flexible for debugging)
    if (payload.type && payload.type !== 'mobile') {
      console.log('Invalid token type:', payload.type);
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.email || !payload.sub) {
      console.log('Missing required payload fields:', { email: !!payload.email, sub: !!payload.sub });
      throw new UnauthorizedException('Invalid token payload - missing email or sub');
    }

    console.log('Looking for attendee with ID:', payload.sub, 'email:', payload.email);

    // Find attendee by ID first (more secure)
    let attendee = await this.prisma.attendee.findFirst({
      where: { 
        id: payload.sub,
      },
    });

    console.log('Found attendee by ID:', attendee ? { id: attendee.id, email: attendee.email } : 'none');

    // If not found by ID, try by email
    if (!attendee) {
      console.log('Attendee not found by ID, searching by email:', payload.email);
      attendee = await this.prisma.attendee.findFirst({
        where: {
          email: {
            mode: 'insensitive',
            equals: payload.email.trim(),
          },
        },
      });
      console.log('Found attendee by email:', attendee ? { id: attendee.id, email: attendee.email } : 'none');
    }

    // If we found an attendee, verify email matches (case-insensitive)
    if (attendee) {
      const emailMatches = attendee.email.toLowerCase() === payload.email.toLowerCase();
      console.log('Email match check:', { attendeeEmail: attendee.email, payloadEmail: payload.email, matches: emailMatches });
      
      if (!emailMatches) {
        console.log('Email mismatch - creating new search');
        // Try one more time with exact email match
        attendee = await this.prisma.attendee.findFirst({
          where: {
            email: payload.email.trim(),
          },
        });
      }
    }

    if (!attendee) {
      console.log('No attendee found for payload:', { id: payload.sub, email: payload.email });
      throw new UnauthorizedException('User not found in database');
    }

    console.log('MobileJwtStrategy validated attendee:', { 
      id: attendee.id, 
      email: attendee.email, 
      eventId: attendee.eventId 
    });
    
    // Return the attendee object - this will be attached to request.user
    return attendee;
  }
}
