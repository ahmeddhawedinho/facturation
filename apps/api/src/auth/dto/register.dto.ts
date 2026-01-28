import { IsEmail, IsString, MinLength, IsOptional, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsString()
    legalName: string;

    @IsString()
    address: string;

    @IsString()
    city: string;

    @IsString()
    fiscalNumber: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateCompanyDto)
    company?: CreateCompanyDto;
}
