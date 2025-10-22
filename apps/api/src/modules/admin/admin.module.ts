import { Module } from '@nestjs/common';
import { AdminEventsModule } from './events/admin-events.module';
import { AdminAuthModule } from './auth/admin-auth.module';

@Module({
  imports: [AdminEventsModule, AdminAuthModule],
  exports: [AdminEventsModule, AdminAuthModule],
})
export class AdminModule {}