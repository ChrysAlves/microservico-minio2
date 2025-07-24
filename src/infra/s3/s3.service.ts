// ARQUIVO: src/infra/s3/s3.service.ts

import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import type { Express } from 'express';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly internalEndpoint: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.internalEndpoint = this.configService.get<string>('S3_ENDPOINT');
    this.publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');

    this.logger.log(`[S3_CONFIG] Endereço INTERNO configurado: ${this.internalEndpoint}`);
    this.logger.log(`[S3_CONFIG] Endereço PÚBLICO configurado: ${this.publicUrl}`);

    if (!this.internalEndpoint || !this.publicUrl) {
      throw new Error('As variáveis de ambiente S3_ENDPOINT e MINIO_PUBLIC_URL devem ser definidas!');
    }

    this.s3 = new S3Client({
      endpoint: this.internalEndpoint,
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    const requiredBuckets = ['originals', 'preservation'];
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


  async generatePresignedUrl(bucket: string, path: string): Promise<string> {
    this.logger.log(`Gerando URL pré-assinada para: [${bucket}/${path}]`);
    
    const filename = path.split('/').pop();

    const publicS3Client = new S3Client({
      endpoint: this.publicUrl,
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
      ResponseContentDisposition: `attachment; filename="${filename}"`
    });

    try {
      const url = await getSignedUrl(publicS3Client, command, { expiresIn: 900 });
      this.logger.log(`URL pública (com anexo forçado) gerada com sucesso: ${url}`);
      return url;

    } catch (error) {
      this.logger.error(`Falha ao gerar URL pré-assinada para [${path}]`, error.stack);
      throw new NotFoundException('Não foi possível gerar a URL para o arquivo especificado.');
    }
  }
}