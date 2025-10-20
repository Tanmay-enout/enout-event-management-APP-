import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address to verify OTP for',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'OTP code to verify',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp!: string;
}
