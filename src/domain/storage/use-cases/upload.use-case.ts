import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../../infra/s3/s3.service';
import type { Express } from 'express';

interface UploadParams {
  file: Express.Multer.File;
  bucket: string;
  key: string;
}

@Injectable()
export class UploadUseCase {
  private readonly logger = new Logger(UploadUseCase.name);
  constructor(private readonly s3Service: S3Service) {}

  async execute({ file, bucket, key }: UploadParams) {
    this.logger.log(`Executando caso de uso: Upload para bucket [${bucket}], chave [${key}]`);
    return this.s3Service.upload(file, bucket, key);
  }
}