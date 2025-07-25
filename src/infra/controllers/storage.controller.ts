import {
    Body,
    Controller,
    Delete,
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
import { GerarUrlUseCase } from '../../domain/storage/use-cases/gerar-url.use-case';
import { DeleteFileUseCase } from '../../domain/storage/use-cases/delete.use-case';
import { DownloadBodyDto } from '../../domain/storage/dtos/download.dto';

@Controller('storage')
export class StorageController {
    constructor(
        private readonly uploadFileUseCase: UploadUseCase,
        private readonly generatePresignedUrlUseCase: GerarUrlUseCase,
        private readonly deleteFileUseCase: DeleteFileUseCase,
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

    @Post('generate-url')
    async generateUrl(@Body() body: DownloadBodyDto) {
        const url = await this.generatePresignedUrlUseCase.execute(
            body.bucket,
            body.path,
        );
        return { url };
    }

    @Delete('file')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFile(@Body() body: DownloadBodyDto): Promise<void> {
        await this.deleteFileUseCase.execute(body.bucket, body.path);
    }
}