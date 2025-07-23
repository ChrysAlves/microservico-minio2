// ARQUIVO: src/infra/controllers/storage.controller.ts

import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    HttpCode,
    HttpStatus,
    ParseFilePipe,
    MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileUseCase } from '../../domain/storage/use-cases/upload.use-case';
import type { Express } from 'express';

@Controller('storage')
export class StorageController {
    constructor(private readonly uploadFileUseCase: UploadFileUseCase) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })], // 100MB
            }),
        )
        file: Express.Multer.File,
        @Body('bucket') bucket: string,
        @Body('key') key: string,
    ) {
        return this.uploadFileUseCase.execute({ file, bucket, key });
    }
}