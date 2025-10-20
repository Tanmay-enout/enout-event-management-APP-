import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { configureSwagger } from './config/swagger.config';
import { configureSecurityMiddleware } from './config/security.config';
import { ApiLogger } from './common/logger/api-logger.service';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ApiLogger(),
  });

  // Get configuration
  const appConfig = app.get(AppConfig);

  // Enable CORS FIRST (before security middleware)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = appConfig.corsOrigins;
      
      // Allow requests from allowed origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      // Allow requests from localhost, 127.0.0.1, and local network IPs for development
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.includes('10.0.') ||
          origin.includes('172.')) {
        console.log('CORS allowing local network origin:', origin);
        return callback(null, true);
      }
      
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
  });

  // Configure security middleware
  configureSecurityMiddleware(app, appConfig);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Configure Swagger documentation
  if (appConfig.nodeEnv === 'development') {
    configureSwagger(app);
  }

  // Start server - bind to all interfaces for physical device access
  const port = appConfig.port || 3003;
  await app.listen(port, '0.0.0.0');

  const logger = new ApiLogger();
  logger.log(`Application is running on:`);
  logger.log(`  - Local: http://localhost:${port}`);
  logger.log(`  - Network: http://192.168.31.181:${port}`);
  logger.log('Environment:', appConfig.nodeEnv);
  logger.log('CORS origins:', appConfig.corsOrigins.join(', '));
  logger.log('Rate limit:', JSON.stringify(appConfig.rateLimit));
}

bootstrap();