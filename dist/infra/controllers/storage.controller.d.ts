import { UploadUseCase } from '../../domain/storage/use-cases/upload.use-case';
import { GerarUrlUseCase } from '../../domain/storage/use-cases/generar-url.use-case';
import { DownloadBodyDto } from '../../domain/storage/dtos/download.dto';
export declare class StorageController {
    private readonly uploadFileUseCase;
    private readonly GerarUrlUseCase;
    constructor(uploadFileUseCase: UploadUseCase, GerarUrlUseCase: GerarUrlUseCase);
    uploadFile(file: Express.Multer.File, bucket: string, key: string): Promise<{
        path: string;
        etag: string;
    }>;
    generateUrl(body: DownloadBodyDto): Promise<{
        url: string;
    }>;
}
