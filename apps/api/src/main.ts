import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import { json, urlencoded } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    // Enable CORS
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'https://test.danacreativeagency.com'
        ],
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 API démarrée sur http://0.0.0.0:${port}`);
}

bootstrap();