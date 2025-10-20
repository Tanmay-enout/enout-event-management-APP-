import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or email validation failed' })
  @ApiResponse({ status: 404, description: 'User not found in invites' })
  async sendOtp(@Body() dto: SendOtpDto): Promise<{ message: string; eventId: string; eventName?: string }> {
    console.log('AuthController.sendOtp called with:', dto);
    if (!dto?.email) {
      console.error('Email is undefined in request body:', dto);
      throw new BadRequestException('Email is required');
    }
    
    try {
      const result = await this.authService.sendOtp(dto.email);
      return { 
        message: 'OTP sent successfully',
        eventId: result.eventId,
        eventName: result.eventName,
      };
    } catch (error) {
      console.error('sendOtp controller error:', error);
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException as 404
      }
      throw new BadRequestException(error.message || 'Failed to send OTP');
    }
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ access_token: string }> {
    console.log('AuthController.verifyOtp called with:', dto);
    const verified = await this.authService.verifyOtp(dto.email, dto.otp);
    if (!verified) {
      throw new Error('Invalid OTP');
    }
    return this.authService.login(dto.email);
  }

  @Post('attendee/verify')
  @ApiOperation({ summary: 'Verify attendee OTP' })
  @ApiResponse({ status: 200 })
  async verifyAttendeeOtp(@Body() dto: { eventId: string; email: string; otp: string }): Promise<{ access_token: string }> {
    const verified = await this.authService.verifyAttendeeOtp(dto.eventId, dto.email, dto.otp);
    if (!verified) {
      throw new Error('Invalid OTP');
    }
    return this.authService.login(dto.email);
  }

  @Post('invite/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 404, description: 'Attendee not found' })
  async acceptInvite(@Body() dto: SendOtpDto): Promise<{ message: string }> {
    console.log('AuthController.acceptInvite called with:', dto);
    await this.authService.acceptInvite(dto.email);
    return { message: 'Invitation accepted successfully' };
  }

  @Post('phone/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request phone verification OTP' })
  @ApiBody({ type: RequestPhoneOtpDto })
  @ApiResponse({ status: 200, description: 'Phone OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async requestPhoneOtp(@Body() dto: RequestPhoneOtpDto): Promise<{ message: string }> {
    console.log('AuthController.requestPhoneOtp called with:', dto);
    await this.authService.requestPhoneOtp(dto.phone, dto.userEmail);
    return { message: 'Phone OTP sent successfully' };
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone OTP' })
  @ApiBody({ type: VerifyPhoneOtpDto })
  @ApiResponse({ status: 200, description: 'Phone verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto): Promise<{ message: string }> {
    console.log('AuthController.verifyPhoneOtp called with:', dto);
    const verified = await this.authService.verifyPhoneOtp(dto.phone, dto.code, dto.userEmail);
    if (!verified) {
      throw new BadRequestException('Invalid OTP code');
    }
    return { message: 'Phone verified successfully' };
  }
}