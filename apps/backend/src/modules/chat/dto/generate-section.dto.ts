import { IsString, IsUUID, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class GenerateSectionDto {
  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  sectionKey: string; // e.g., 'specific_aims', 'significance'

  @IsObject()
  @IsOptional()
  additionalContext?: Record<string, any>; // User can provide extra context
}
