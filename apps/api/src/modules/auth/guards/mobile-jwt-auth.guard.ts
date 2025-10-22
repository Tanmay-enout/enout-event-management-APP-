import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class MobileJwtAuthGuard extends AuthGuard('mobile-jwt') {
  handleRequest(err: any, user: any, info: any) {
    console.log('=== MobileJwtAuthGuard handleRequest ===');
    console.log('Error:', err ? err.message : 'none');
    console.log('User found:', !!user);
    console.log('Info:', info);
    
    if (err) {
      console.log('Authentication error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 3)
      });
      throw err;
    }
    
    if (!user) {
      console.log('No user found after authentication');
      throw new UnauthorizedException(
        info?.message || 'Authentication failed - please log in again'
      );
    }
    
    console.log('Authentication successful for user:', { id: user.id, email: user.email });
    return user;
  }
}
