import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsEmail } from 'class-validator';

export class VerifyPhoneOtpDto {
  @ApiProperty({
    description: 'Phone number to verify OTP for',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({
    description: 'OTP code to verify',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({
    description: 'User email to associate with phone verification',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;
}
