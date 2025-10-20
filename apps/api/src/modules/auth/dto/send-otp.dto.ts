import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP to',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
