// ARQUIVO: src/infra/controllers/storage.controller.ts

// Imports do upload e os básicos do NestJS
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    MaxFileSizeValidator,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { UploadUseCase } from '../../domain/storage/use-cases/upload.use-case';
// Imports do generate-url
import { GerarUrlUseCase } from '../../domain/storage/use-cases/generar-url.use-case';
import { DownloadBodyDto } from '../../domain/storage/dtos/download.dto';

@Controller('storage')
export class StorageController {
    constructor(
        private readonly uploadFileUseCase: UploadUseCase,
        private readonly GerarUrlUseCase: GerarUrlUseCase, // A injeção do DownloadUseCase foi removida
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })],
            }),
        )
        file: Express.Multer.File,
        @Body('bucket') bucket: string,
        @Body('key') key: string,
    ) {
        return this.uploadFileUseCase.execute({ file, bucket, key });
    }

    // O MÉTODO 'download' QUE ESTAVA AQUI FOI REMOVIDO

    @Post('generate-url')
    async generateUrl(@Body() body: DownloadBodyDto) {
        const url = await this.GerarUrlUseCase.execute(
            body.bucket,
            body.path,
        );
        return { url };
    }
}