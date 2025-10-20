import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class RequestPhoneOtpDto {
  @ApiProperty({
    description: 'Phone number to send OTP to',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({
    description: 'User email to associate with phone verification',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;
}
