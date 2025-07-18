import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3003;

  app.enableCors(); // Habilita CORS para ser acessível por outros serviços
  await app.listen(port);
  console.log(`Microsserviço de Storage (MinIO) rodando na porta: ${port}`);
}
bootstrap();