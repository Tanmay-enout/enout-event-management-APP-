import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(eventId: string) {
    return this.prisma.mobileMessage.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMessage(eventId: string, id: string) {
    const message = await this.prisma.mobileMessage.findFirst({
      where: { id, eventId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID "${id}" not found`);
    }

    return message;
  }

  async createMessage(eventId: string, data: any) {
    console.log('=== createMessage DEBUG ===');
    console.log('EventId:', eventId);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    // If this is a broadcast message (no specific attendeeId) and status is 'sent'
    // create individual messages for all attendees
    if (!data.attendeeId && (data.status === 'sent' || data.status === undefined)) {
      // Get attendees for this event
      const allAttendees = await this.prisma.attendee.findMany({
        where: { eventId },
        select: { id: true, email: true },
      });

      console.log('All attendees:', allAttendees.length);
      console.log('Audience:', data.audience);

      let attendees = allAttendees;

      // Filter based on audience
      if (data.audience === 'invited' || data.audience === 'accepted') {
        console.log('Filtering by audience:', data.audience);
        
        if (data.audience === 'accepted') {
          // For accepted audience, we can check both invite status and attendee acceptedAt field
          const attendeeEmails = allAttendees.map(a => a.email);
          
          // Get invites with accepted status
          const acceptedInvites = await this.prisma.invite.findMany({
            where: {
              eventId,
              email: { in: attendeeEmails },
              status: 'accepted',
            },
            select: { email: true, status: true },
          });

          console.log('Found accepted invites:', acceptedInvites.length);
          console.log('Accepted invites:', JSON.stringify(acceptedInvites, null, 2));

          // Also get attendees who have acceptedAt field set (alternative indicator)
          const attendeesWithAcceptedAt = await this.prisma.attendee.findMany({
            where: {
              eventId,
              email: { in: attendeeEmails },
              acceptedAt: { not: null },
            },
            select: { email: true, acceptedAt: true },
          });

          console.log('Found attendees with acceptedAt:', attendeesWithAcceptedAt.length);
          console.log('Attendees with acceptedAt:', JSON.stringify(attendeesWithAcceptedAt, null, 2));

          // Combine both criteria: either has accepted invite OR has acceptedAt field set
          const acceptedInviteEmails = new Set(acceptedInvites.map(i => i.email));
          const acceptedAtEmails = new Set(attendeesWithAcceptedAt.map(a => a.email));
          
          // Union of both sets
          const allAcceptedEmails = new Set([...acceptedInviteEmails, ...acceptedAtEmails]);
          
          attendees = allAttendees.filter(a => allAcceptedEmails.has(a.email));
        } else {
          // For 'invited' audience, check for any invite status
          const attendeeEmails = allAttendees.map(a => a.email);
          
          const invites = await this.prisma.invite.findMany({
            where: {
              eventId,
              email: { in: attendeeEmails },
              status: { in: ['pending', 'accepted', 'sent'] },
            },
            select: { email: true, status: true },
          });

          console.log('Found invites:', invites.length);
          console.log('Invites:', JSON.stringify(invites, null, 2));

          const invitedEmails = new Set(invites.map(i => i.email));
          attendees = allAttendees.filter(a => invitedEmails.has(a.email));
        }
        
        console.log('Filtered attendees:', attendees.length);
        console.log('Filtered attendee emails:', attendees.map(a => a.email));
      }
      // For 'all' or undefined audience, use all attendees

      // Create individual MobileMessage records for each attendee
      console.log('Creating messages for', attendees.length, 'attendees');
      
      const mobileMessages = await Promise.all(
        attendees.map(async (attendee) => {
          console.log('Creating message for attendee:', attendee.email, 'ID:', attendee.id);
          const message = await this.prisma.mobileMessage.create({
            data: {
              eventId,
              attendeeId: attendee.id,
              title: data.title,
              body: data.body,
              attachments: data.attachments || {},
              status: data.status || 'sent',
              unread: true,
            },
          });
          console.log('Created message:', message.id, 'for attendee:', attendee.email);
          return message;
        })
      );

      console.log('Total messages created:', mobileMessages.length);
      // Return the first message as a representative
      return mobileMessages[0];
    } else {
      // Create individual message
      return this.prisma.mobileMessage.create({
        data: {
          eventId,
          title: data.title,
          body: data.body,
          attachments: data.attachments || {},
          attendeeId: data.attendeeId,
          status: data.status || 'sent',
          unread: data.attendeeId ? true : false,
        },
      });
    }
  }

  async updateMessage(eventId: string, id: string, data: any) {
    try {
      return await this.prisma.mobileMessage.update({
        where: { id },
        data: {
          ...data,
          eventId,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Message with ID "${id}" not found`);
      }
      throw error;
    }
  }

  async deleteMessage(eventId: string, id: string) {
    try {
      await this.prisma.mobileMessage.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Message with ID "${id}" not found`);
      }
      throw error;
    }
  }

  async createBroadcast(eventId: string, data: any) {
    return this.prisma.broadcast.create({
      data: {
        eventId,
        title: data.subject,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        status: data.status,
        scheduledAt: data.scheduledAt,
        createdBy: data.createdBy,
      },
    });
  }

  async sendMessage(eventId: string, messageId: string) {
    // First, try to find the message as a MobileMessage (individual message)
    let message = await this.prisma.mobileMessage.findFirst({
      where: { id: messageId, eventId },
    });

    let messageData: any = null;

    if (message) {
      // It's an individual message
      messageData = {
        title: message.title,
        body: message.body,
        attachments: message.attachments || {},
      };
    } else {
      // Try to find it as a Broadcast message
      const broadcast = await this.prisma.broadcast.findFirst({
        where: { id: messageId, eventId },
      });

      if (!broadcast) {
        throw new NotFoundException(`Message with ID "${messageId}" not found`);
      }

      messageData = {
        title: broadcast.title,
        body: broadcast.bodyHtml,
        attachments: {},
      };

      // Update broadcast status to sent
      await this.prisma.broadcast.update({
        where: { id: messageId },
        data: { 
          status: 'sent',
          sentAt: new Date(),
        },
      });
    }

    // Get all attendees for this event
    const attendees = await this.prisma.attendee.findMany({
      where: { eventId },
      select: { id: true },
    });

    // Create individual MobileMessage records for each attendee
    const mobileMessages = await Promise.all(
      attendees.map(attendee =>
        this.prisma.mobileMessage.create({
          data: {
            eventId,
            attendeeId: attendee.id,
            title: messageData.title,
            body: messageData.body,
            attachments: messageData.attachments,
            status: 'sent',
            unread: true,
          },
        })
      )
    );

    // Return the first message or create a summary message
    return mobileMessages[0] || message;
  }
}
