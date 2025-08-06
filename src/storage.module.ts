import { Module } from '@nestjs/common';
import { S3Module } from './infra/s3/s3.module';
import { StorageController } from './infra/controllers/storage.controller';
import { UploadUseCase } from './domain/storage/use-cases/upload.use-case';
import { GerarUrlUseCase } from './domain/storage/use-cases/gerar-url.use-case';
import { DeleteFileUseCase } from './domain/storage/use-cases/delete.use-case';
import { GetFileMetadataUseCase } from './domain/storage/use-cases/get-file-metadata.use-case';

@Module({
  imports: [S3Module],
  controllers: [StorageController],
  providers: [
    UploadUseCase,
    GerarUrlUseCase,
    DeleteFileUseCase,
    GetFileMetadataUseCase,
  ],
})
export class StorageModule { }