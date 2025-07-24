import { S3Service } from '../../../infra/s3/s3.service';
import { UploadFileDto } from '../dtos/upload.dto';
export declare class UploadUseCase {
    private readonly s3Service;
    private readonly logger;
    constructor(s3Service: S3Service);
    execute(dto: UploadFileDto): Promise<{
        path: string;
        etag: string;
    }>;
}
