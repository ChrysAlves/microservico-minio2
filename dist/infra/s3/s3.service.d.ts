import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class S3Service implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly s3;
    constructor(configService: ConfigService);
    generatePresignedUrl(bucket: string, path: string): Promise<string>;
    onModuleInit(): Promise<void>;
    upload(file: Express.Multer.File, bucket: string, key: string): Promise<{
        path: string;
        etag: string;
    }>;
}
