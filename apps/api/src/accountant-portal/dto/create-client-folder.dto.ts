import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateClientFolderDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    legalName?: string;

    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsString()
    fiscalNumber: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    contactFirstName?: string;

    @IsOptional()
    @IsString()
    contactLastName?: string;
}
