import { IsOptional, IsString, IsEnum, IsArray, IsDateString } from 'class-validator';

export class ExportDocumentsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @IsEnum(['pdf', 'csv', 'excel'])
  format: 'pdf' | 'csv' | 'excel';

  @IsEnum(['sales', 'purchase'])
  section: 'sales' | 'purchase';

  @IsOptional()
  @IsEnum(['individual', 'consolidated'])
  pdfMode?: 'individual' | 'consolidated';
}
