import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../../infra/s3/s3.service';

@Injectable()
export class DeleteFileUseCase {
  private readonly logger = new Logger(DeleteFileUseCase.name);

  constructor(private readonly s3Service: S3Service) {}

  async execute(bucket: string, path: string): Promise<void> {
    this.logger.log(`Executando caso de uso de deleção para: ${bucket}/${path}`);
    await this.s3Service.deleteFile(bucket, path);
  }
}