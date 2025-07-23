// ARQUIVO: src/domain/storage/dtos/upload.dto.ts

import type { Express } from 'express';

// DTO com os dados necessários para o caso de uso de upload
export class UploadFileDto {
    file: Express.Multer.File;
    bucket: string;
    key: string;
}