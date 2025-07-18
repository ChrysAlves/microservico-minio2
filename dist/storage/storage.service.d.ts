import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    private readonly s3;
    constructor(configService: ConfigService);
    upload(file: Express.Multer.File, bucket: string, key: string): Promise<{
        path: string;
        etag: string;
    }>;
}
