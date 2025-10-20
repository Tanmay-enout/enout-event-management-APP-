import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.event.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        timezone: true,
        status: true,
        location: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attendees: true,
            invites: true,
            itineraryItems: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        itineraryItems: {
          orderBy: {
            start: 'asc',
          },
        },
        _count: {
          select: {
            attendees: true,
            invites: true,
            itineraryItems: true,
            rooms: true,
          },
        },
      },
    });
  }
}
