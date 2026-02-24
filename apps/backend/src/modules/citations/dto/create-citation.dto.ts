import { IsString, IsOptional, IsInt, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum CitationType {
  JOURNAL_ARTICLE = 'journal_article',
  BOOK = 'book',
  BOOK_CHAPTER = 'book_chapter',
  CONFERENCE = 'conference',
  WEBSITE = 'website',
  PREPRINT = 'preprint',
  THESIS = 'thesis',
  PATENT = 'patent',
  OTHER = 'other',
}

export class AuthorDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  suffix?: string; // Jr., Sr., III, etc.

  @IsOptional()
  @IsString()
  affiliation?: string;
}

export class CreateCitationDto {
  @IsUUID()
  applicationId: string;

  // Option 1: Provide identifiers (auto-fetch)
  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  pmid?: string;

  @IsOptional()
  @IsString()
  pmcid?: string;

  // Option 2: Provide manual data
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors?: AuthorDto[];

  @IsOptional()
  @IsString()
  journal?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsString()
  issue?: string;

  @IsOptional()
  @IsString()
  pages?: string;

  @IsOptional()
  @IsString()
  publicationDate?: string;

  @IsOptional()
  @IsEnum(CitationType)
  citationType?: CitationType;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
