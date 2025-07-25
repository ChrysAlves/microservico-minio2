import { IsNotEmpty, IsString } from 'class-validator';

export class DownloadBodyDto {
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @IsString()
  @IsNotEmpty()
  path: string;
}