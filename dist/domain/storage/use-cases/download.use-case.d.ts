import { S3Service } from '../../../infra/s3/s3.service';
import { Readable } from 'stream';
export declare class DownloadUseCase {
    private readonly s3Service;
    private readonly logger;
    constructor(s3Service: S3Service);
    execute(bucket: string, path: string): Promise<Readable>;
}
