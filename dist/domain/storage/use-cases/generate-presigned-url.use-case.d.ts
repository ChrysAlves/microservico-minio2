import { S3Service } from '../../../infra/s3/s3.service';
export declare class GerarUrlUseCase {
    private readonly s3Service;
    private readonly logger;
    constructor(s3Service: S3Service);
    execute(bucket: string, path: string): Promise<string>;
}
