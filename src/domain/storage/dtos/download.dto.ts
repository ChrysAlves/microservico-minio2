import { IsNotEmpty, IsString } from 'class-validator';

export class DownloadBodyDto {
  @IsString({ message: 'O campo bucket deve ser uma string.' })
  @IsNotEmpty({ message: 'O campo bucket não pode estar vazio.' })
  bucket: string;

  @IsString({ message: 'O campo path deve ser uma string.' })
  @IsNotEmpty({ message: 'O campo path não pode estar vazio.' })
  path: string;
}