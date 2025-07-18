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
import { StorageService } from './storage.service';
import type { Express } from 'express'; 

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })], // Limite de 100MB
      }),
    )
    file: Express.Multer.File,
    @Body('bucket') bucket: string,
    @Body('key') key: string,
  ) {
    return this.storageService.upload(file, bucket, key);
  }
}