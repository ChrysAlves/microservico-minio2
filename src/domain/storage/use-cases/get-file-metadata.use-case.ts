import { Injectable } from '@nestjs/common';
import { S3Service } from '../../../infra/s3/s3.service';

@Injectable()
export class GetFileMetadataUseCase {
  constructor(private readonly s3Service: S3Service) {}

  async execute(bucket: string, path: string) {
    return this.s3Service.getFileMetadata(bucket, path);
  }
}