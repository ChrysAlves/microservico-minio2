import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import type { Express } from 'express';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly defaultBucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.defaultBucket = this.configService.get<string>('S3_BUCKET', 'documentos');
    
    this.logger.log(`[S3_CONFIG] Configurando cliente S3 para o endpoint: ${endpoint}`);

    if (!endpoint) {
      throw new Error('Variável de ambiente S3_ENDPOINT não está definida!');
    }

    this.s3 = new S3Client({
      endpoint: endpoint,
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

 async onModuleInit() {
    const requiredBuckets = [
      this.configService.get<string>('S3_BUCKET', 'documentos'),
      'preservation', // Adicione o outro bucket aqui
    ];

    this.logger.log(`Verificando buckets necessários: [${requiredBuckets.join(', ')}]`);

    for (const bucketName of requiredBuckets) {
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        this.logger.log(`Bucket [${bucketName}] já existe.`);
      } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          this.logger.log(`Bucket [${bucketName}] não encontrado. Criando...`);
          try {
            await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
            this.logger.log(`Bucket [${bucketName}] criado com sucesso.`);
          } catch (creationError) {
            this.logger.error(`Falha ao criar o bucket [${bucketName}]`, creationError);
          }
        } else {
          this.logger.error(`Erro inesperado ao verificar o bucket [${bucketName}]:`, error);
        }
      }
    }
  }

  async upload(
    file: Express.Multer.File,
    bucket: string,
    key: string,
  ): Promise<{ path: string; etag: string }> {
    this.logger.log(`Iniciando upload para bucket: [${bucket}], chave: [${key}]`);

    const command = new PutObjectCommand({
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
    } catch (error) {
      this.logger.error(`Falha no upload para o MinIO: ${error.message}`, error.stack);
      throw new Error('Falha ao salvar o arquivo no armazenamento.');
    }
  }
}