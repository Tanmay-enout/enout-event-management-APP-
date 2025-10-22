import { Controller, Get, Post, Request, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AdminProfileResponseDto } from './dto/admin-profile.dto';
import { AdminLoginDto, AdminTokensResponseDto } from './dto/admin-login.dto';
import { AdminAuthService } from './admin-auth.service';

@ApiTags('Admin Auth')
@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, type: AdminTokensResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: AdminLoginDto): Promise<AdminTokensResponseDto> {
    const admin = await this.authService.validateAdmin(dto.email, dto.password);
    return this.authService.generateTokens(admin.id, admin.email);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get admin profile' })
  @ApiResponse({ status: 200, description: 'Admin profile' })
  async getProfile(@Request() req: { user: any }): Promise<AdminProfileResponseDto> {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}