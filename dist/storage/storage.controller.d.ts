import { StorageService } from './storage.service';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    uploadFile(file: Express.Multer.File, bucket: string, key: string): Promise<{
        path: string;
        etag: string;
    }>;
}
