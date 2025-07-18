"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
let StorageService = StorageService_1 = class StorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StorageService_1.name);
        const endpoint = this.configService.get('S3_ENDPOINT');
        this.logger.log(`[S3_CONFIG] Configurando cliente S3 para o endpoint: ${endpoint}`);
        if (!endpoint) {
            throw new Error('Variável de ambiente S3_ENDPOINT não está definida!');
        }
        this.s3 = new client_s3_1.S3Client({
            endpoint: endpoint,
            region: this.configService.get('S3_REGION'),
            credentials: {
                accessKeyId: this.configService.get('S3_ACCESS_KEY'),
                secretAccessKey: this.configService.get('S3_SECRET_KEY'),
            },
            forcePathStyle: true,
        });
    }
    async upload(file, bucket, key) {
        this.logger.log(`Iniciando upload para bucket: [${bucket}], chave: [${key}]`);
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        try {
            const response = await this.s3.send(command);
            const filePath = `${bucket}/${key}`;
            this.logger.log(`Arquivo salvo com sucesso em: ${filePath}`);
            return { path: filePath, etag: response.ETag };
        }
        catch (error) {
            this.logger.error(`Falha no upload para o MinIO: ${error.message}`, error.stack);
            throw new Error('Falha ao salvar o arquivo no armazenamento.');
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map