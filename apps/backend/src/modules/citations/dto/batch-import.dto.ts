import { IsString, IsArray, IsEnum, IsUUID } from 'class-validator';

export enum ImportSource {
  DOI = 'doi',
  PMID = 'pmid',
  BIBTEX = 'bibtex',
  MANUAL = 'manual',
}

export class BatchImportDto {
  @IsUUID()
  applicationId: string;

  @IsEnum(ImportSource)
  source: ImportSource;

  @IsArray()
  @IsString({ each: true })
  identifiers: string[]; // Array of DOIs, PMIDs, etc.
}

export enum CitationFormat {
  NIH = 'nih',
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
}

export class FormatCitationDto {
  @IsEnum(CitationFormat)
  format: CitationFormat;
}
