// ARQUIVO: src/domain/storage/use-cases/generate-presigned-url.use-case.ts

import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../../infra/s3/s3.service';

@Injectable()
export class GerarUrlUseCase {
    private readonly logger = new Logger(GerarUrlUseCase.name);

    constructor(private readonly s3Service: S3Service) { }

    async execute(bucket: string, path: string): Promise<string> {
        this.logger.log(`Executando caso de uso de geração de URL para: ${bucket}/${path}`);
        return this.s3Service.generatePresignedUrl(bucket, path);
    }
}