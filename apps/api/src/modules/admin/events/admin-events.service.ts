import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFiltersDto } from './dto/event-filters.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: EventFiltersDto) {
    const where: Prisma.EventWhereInput = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search } },
          { location: { contains: filters.search } },
        ],
      }),
      ...(filters.status && { status: filters.status }),
      ...(filters.creatorId && { createdBy: filters.creatorId }),
    };

    const events = await this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return events;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async create(createEventDto: CreateEventDto) {
    // Get system user ID
    const systemUser = await this.prisma.user.findUnique({
      where: { email: 'system@enout.app' },
    });

    if (!systemUser) {
      throw new Error('System user not found. Please run: pnpm prisma:seed');
    }

    const event = await this.prisma.event.create({
      data: {
        name: createEventDto.name,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        timezone: createEventDto.timezone,
        location: createEventDto.location,
        imageUrl: createEventDto.imageUrl,
        status: createEventDto.status || 'draft',
        createdBy: systemUser.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...(updateEventDto.name && { name: updateEventDto.name }),
        ...(updateEventDto.startDate && { startDate: new Date(updateEventDto.startDate) }),
        ...(updateEventDto.endDate && { endDate: new Date(updateEventDto.endDate) }),
        ...(updateEventDto.timezone && { timezone: updateEventDto.timezone }),
        ...(updateEventDto.location !== undefined && { location: updateEventDto.location }),
        ...(updateEventDto.imageUrl !== undefined && { imageUrl: updateEventDto.imageUrl }),
        ...(updateEventDto.status && { status: updateEventDto.status }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return event;
  }

  async remove(id: string) {
    await this.prisma.event.delete({
      where: { id },
    });
  }

  async uploadEventImage(eventId: string, file: any) {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Generate a safe filename
    const originalName = file.originalname || 'event-image';
    const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const extension = originalName.split('.').pop() || 'jpg';
    const finalFileName = `${eventId}_${timestamp}_${safeFileName}`;

    // For now, we'll store the file path - in production you'd upload to S3/Azure/etc.
    const imageUrl = `/uploads/events/${finalFileName}`;

    try {
      // Update the event with the image URL
      const updatedEvent = await this.prisma.event.update({
        where: { id: eventId },
        data: {
          imageUrl: imageUrl,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Event image uploaded successfully',
        imageUrl: imageUrl,
        event: updatedEvent,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update event image: ${error.message}`);
    }
  }
}