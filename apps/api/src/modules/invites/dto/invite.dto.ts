import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsEmail, 
  IsEnum, 
  IsInt, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  Max, 
  Min, 
  ValidateNested 
} from 'class-validator';

export class InviteRowDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '+1', required: false })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiProperty({ example: '5551234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class InviteImportDto {
  @ApiProperty({ type: [InviteRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteRowDto)
  rows!: InviteRowDto[];
}

export class GuestsQueryDto {
  @ApiProperty({ required: false, example: 'john' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ 
    required: false, 
    example: 'invited,email_verified',
    description: 'Comma-separated list of statuses to filter by'
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ 
    required: false, 
    enum: ['newest', 'oldest', 'name', 'status'],
    default: 'newest'
  })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'name', 'status'])
  sort?: 'newest' | 'oldest' | 'name' | 'status' = 'newest';

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}

export class GuestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  firstName?: string | null;

  @ApiProperty({ required: false })
  lastName?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ required: false })
  countryCode?: string | null;

  @ApiProperty({ enum: ['not_invited', 'invited', 'email_verified', 'accepted', 'registered'] })
  derivedStatus!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ required: false })
  lastSentAt?: Date | null;

  @ApiProperty({ required: false })
  acceptedAt?: Date | null;

  // NEW: Registration form fields
  @ApiProperty({ required: false })
  workEmail?: string | null;

  @ApiProperty({ required: false })
  location?: string | null;

  @ApiProperty({ required: false })
  gender?: string | null;

  @ApiProperty({ required: false })
  dietaryRequirements?: string | null;

  @ApiProperty({ required: false })
  idDocUrl?: string | null;

  @ApiProperty({ required: false })
  phoneVerified?: boolean;
}

export class GuestsResponseDto {
  @ApiProperty({ type: [GuestDto] })
  data!: GuestDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
