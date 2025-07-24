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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
let S3Service = S3Service_1 = class S3Service {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(S3Service_1.name);
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
    async generatePresignedUrl(bucket, path) {
        this.logger.log(`Gerando URL pré-assinada para: [${bucket}/${path}]`);
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucket,
            Key: path,
        });
        try {
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn: 900 });
            this.logger.log(`URL gerada com sucesso.`);
            return url;
        }
        catch (error) {
            this.logger.error(`Falha ao gerar URL pré-assinada para [${path}]`, error.stack);
            throw new common_1.NotFoundException('Não foi possível gerar a URL para o arquivo especificado, verifique se o arquivo existe.');
        }
    }
    async onModuleInit() {
        const requiredBuckets = ['originals', 'preservation'];
        this.logger.log(`Verificando buckets necessários: [${requiredBuckets.join(', ')}]`);
        for (const bucketName of requiredBuckets) {
            try {
                await this.s3.send(new client_s3_1.HeadBucketCommand({ Bucket: bucketName }));
                this.logger.log(`Bucket [${bucketName}] já existe.`);
            }
            catch (error) {
                if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                    this.logger.log(`Bucket [${bucketName}] não encontrado. Criando...`);
                    try {
                        await this.s3.send(new client_s3_1.CreateBucketCommand({ Bucket: bucketName }));
                        this.logger.log(`Bucket [${bucketName}] criado com sucesso.`);
                    }
                    catch (creationError) {
                        this.logger.error(`Falha ao criar o bucket [${bucketName}]`, creationError);
                    }
                }
                else {
                    this.logger.error(`Erro inesperado ao verificar o bucket [${bucketName}]:`, error);
                }
            }
        }
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
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map