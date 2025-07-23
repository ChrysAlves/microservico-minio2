// ARQUIVO: src/domain/storage/use-cases/upload.use-case.ts

import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../../infra/s3/s3.service';
import { UploadFileDto } from '../dtos/upload.dto';

@Injectable()
export class UploadFileUseCase {
    private readonly logger = new Logger(UploadFileUseCase.name);

    constructor(private readonly s3Service: S3Service) { }

    async execute(
        dto: UploadFileDto,
    ): Promise<{ path: string; etag: string }> {
        this.logger.log(
            `Executando caso de uso: Upload para bucket [${dto.bucket}], chave [${dto.key}]`,
        );

        return this.s3Service.upload(dto.file, dto.bucket, dto.key);
    }
}