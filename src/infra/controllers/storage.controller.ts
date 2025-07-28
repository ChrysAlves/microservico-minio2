import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles, // ALTERADO de UploadedFile
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express'; // ALTERADO de FileInterceptor
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
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10)) 
  @HttpCode(HttpStatus.CREATED)
  async uploadFiles( 
    @UploadedFiles( 
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })],
      }),
    )
    files: Array<Express.Multer.File>, 
    @Body('bucket') bucket: string,
    @Body('keyPrefix') keyPrefix: string,
  ) {
    return this.uploadFileUseCase.execute({ files, bucket, keyPrefix });
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