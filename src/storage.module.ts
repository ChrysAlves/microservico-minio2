// ARQUIVO: src/storage.module.ts

import { Module } from '@nestjs/common';
import { S3Module } from './infra/s3/s3.module';
import { StorageController } from './infra/controllers/storage.controller';
import { UploadFileUseCase } from './domain/storage/use-cases/upload.use-case';

@Module({
    imports: [S3Module],
    controllers: [StorageController],
    providers: [UploadFileUseCase],
})
export class StorageModule { }