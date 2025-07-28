import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../../infra/s3/s3.service';
import type { Express } from 'express';

interface UploadParams {
  files: Array<Express.Multer.File>;
  bucket: string;
  keyPrefix: string;
}

@Injectable()
export class UploadUseCase {
  private readonly logger = new Logger(UploadUseCase.name);
  constructor(private readonly s3Service: S3Service) {}

  async execute({ files, bucket, keyPrefix }: UploadParams) {
    this.logger.log(`Executando caso de uso: Upload de ${files.length} arquivos para o bucket [${bucket}] com prefixo [${keyPrefix}]`);

    const uploadPromises = files.map(file => {
      const key = `${keyPrefix}/${file.originalname}`;
      return this.s3Service.upload(file, bucket, key);
    });

    const results = await Promise.all(uploadPromises);

    this.logger.log('Todos os uploads foram concluídos com sucesso.');
    return results;
  }
}