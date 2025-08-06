// src/infra/s3/s3.service.ts

import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
  InternalServerErrorException, 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand, 
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

    this.logger.log(
      `[S3_CONFIG] Endereço INTERNO configurado: ${this.internalEndpoint}`,
    );
    this.logger.log(
      `[S3_CONFIG] Endereço PÚBLICO configurado: ${this.publicUrl}`,
    );

    if (!this.internalEndpoint || !this.publicUrl) {
      throw new Error(
        'As variáveis de ambiente S3_ENDPOINT e MINIO_PUBLIC_URL devem ser definidas!',
      );
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
    const requiredBuckets = ['originais', 'preservacoes'];
    this.logger.log(
      `Verificando buckets necessários: [${requiredBuckets.join(', ')}]`,
    );
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
            this.logger.error(
              `Falha ao criar o bucket [${bucketName}]`,
              creationError,
            );
          }
        } else {
          this.logger.error(
            `Erro inesperado ao verificar o bucket [${bucketName}]:`,
            error,
          );
        }
      }
    }
  }

  async upload(
    file: Express.Multer.File,
    bucket: string,
    key: string,
  ): Promise<{ path: string; etag: string }> {
    this.logger.log(
      `Iniciando upload para bucket: [${bucket}], chave: [${key}]`,
    );
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
      this.logger.error(
        `Falha no upload para o MinIO: ${error.message}`,
        error.stack,
      );
      throw new Error('Falha ao salvar o arquivo no armazenamento.');
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    this.logger.log(`Iniciando deleção do objeto: [${bucket}/${path}]`);
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    try {
      await this.s3.send(command);
      this.logger.log(
        `Objeto [${path}] deletado com sucesso do bucket [${bucket}].`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao deletar o objeto [${path}] do MinIO: ${error.message}`,
        error.stack,
      );
      throw new Error('Falha ao deletar o arquivo no armazenamento.');
    }
  }

  async moveFile(
    bucket: string,
    source: string,
    destination: string,
  ): Promise<void> {
    this.logger.log(
      `Iniciando movimentação de '${source}' para '${destination}' no bucket '${bucket}'`,
    );

    const copyParams = {
      Bucket: bucket,
      CopySource: `${bucket}/${source}`, 
      Key: destination,
    };

    const deleteParams = {
      Bucket: bucket,
      Key: source,
    };

    try {
      this.logger.log(`Passo 1/2: Copiando para o novo destino...`);
      await this.s3.send(new CopyObjectCommand(copyParams));

      this.logger.log(`Passo 2/2: Deletando o arquivo original...`);
      await this.s3.send(new DeleteObjectCommand(deleteParams));

      this.logger.log(`Arquivo movido com sucesso.`);
    } catch (error) {
      this.logger.error(
        `Falha ao mover arquivo no MinIO: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Falha ao mover arquivo no storage.',
      );
    }
  }

  async generatePresignedUrl(
    bucket: string,
    path: string,
    filename?: string,
  ): Promise<string> {
    this.logger.log(`Gerando URL pré-assinada para: [${bucket}/${path}]`);

    const finalFilename = filename || path.split('/').pop();

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
      ResponseContentDisposition: `attachment; filename="${finalFilename}"`,
    });

    try {
      const url = await getSignedUrl(publicS3Client, command, {
        expiresIn: 900,
      });
      this.logger.log(
        `URL pública gerada com sucesso para o arquivo: ${finalFilename}`,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Falha ao gerar URL pré-assinada para [${path}]`,
        error.stack,
      );
      throw new NotFoundException(
        'Não foi possível gerar a URL para o arquivo especificado.',
      );
    }
  }

  async getFileMetadata(
    bucket: string,
    path: string,
  ): Promise<{ size: number; lastModified: Date }> {
    this.logger.log(`Buscando metadados para: [${bucket}/${path}]`);
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    try {
      const response = await this.s3.send(command);
      return {
        size: response.ContentLength ?? 0,
        lastModified: response.LastModified ?? new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Falha ao buscar metadados para [${path}]`,
        error.stack,
      );
      throw new NotFoundException(
        'Metadados do arquivo não encontrados no armazenamento.',
      );
    }
  }
}