import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'under_review', 'approved', 'rejected'])
  status?: string;

  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
