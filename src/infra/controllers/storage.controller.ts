// src/infra/controllers/storage.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { UploadUseCase } from '../../domain/storage/use-cases/upload.use-case';
import { GerarUrlUseCase } from '../../domain/storage/use-cases/gerar-url.use-case';
import { DeleteFileUseCase } from '../../domain/storage/use-cases/delete.use-case';
import { DownloadBodyDto } from '../../domain/storage/dtos/download.dto';
import { GetFileMetadataUseCase } from 'src/domain/storage/use-cases/get-file-metadata.use-case';
import { S3Service } from '../s3/s3.service';
import { MoveFileDto } from '../../domain/storage/dtos/move-file.dto';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly uploadFileUseCase: UploadUseCase,
    private readonly generatePresignedUrlUseCase: GerarUrlUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly getFileMetadataUseCase: GetFileMetadataUseCase,
    private readonly s3Service: S3Service,
  ) {}

  @Get('health')
  checkHealth() {
    return { status: 'ok', service: 'storage' };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.CREATED)
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 * 5 })], //5GB
      }),
    )
    files: Array<Express.Multer.File>,
    @Body('bucket') bucket: string,
    @Body('keyPrefix') keyPrefix: string,
  ) {
    return this.uploadFileUseCase.execute({ files, bucket, keyPrefix });
  }

  @Post('move')
  @HttpCode(HttpStatus.OK)
  async moveFile(@Body() moveFileDto: MoveFileDto) {
    const { bucket, source, destination } = moveFileDto;
    await this.s3Service.moveFile(bucket, source, destination);
    return { message: 'Arquivo movido com sucesso.' };
  }

  @Post('generate-url')
  async generateUrl(@Body() body: DownloadBodyDto) {
    console.log('DEBUG-FILENAME: Corpo da requisição recebido no MinIO Service:', body);

    const url = await this.generatePresignedUrlUseCase.execute(
      body.bucket,
      body.path,
      body.filename,
    );
    return { url };
  }

  @Delete('file')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Body() body: DownloadBodyDto): Promise<void> {
    await this.deleteFileUseCase.execute(body.bucket, body.path);
  }

  @Post('metadata')
  async getMetadata(@Body() body: DownloadBodyDto) {
    return this.getFileMetadataUseCase.execute(body.bucket, body.path);
  }
}