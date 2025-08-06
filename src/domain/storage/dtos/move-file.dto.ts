

import { IsNotEmpty, IsString } from 'class-validator';

export class MoveFileDto {
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  destination: string;
}