import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { TaxRatesService } from '../tax-rates/tax-rates.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private companiesService: CompaniesService,
        private taxRatesService: TaxRatesService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Compte désactivé');
        }

        // Récupérer les permissions (Directes + Rôle)
        const permissions = [
            ...(user.permissions as string[] || []),
            ...(user.customRole?.permissions as string[] || [])
        ];

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            permissions,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
                permissions,
                customRole: user.customRole,
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        let companyId: string | undefined;

        // Si l'utilisateur crée une entreprise lors de l'inscription
        if (registerDto.company) {
            const createdCompany = await this.companiesService.create(registerDto.company);
            companyId = createdCompany.id;

            // Créer les taux de TVA par défaut pour l'entreprise tunisienne
            await Promise.all([
                this.taxRatesService.create(companyId, { name: 'TVA 19%', rate: 19.0, isDefault: true }),
                this.taxRatesService.create(companyId, { name: 'TVA 13%', rate: 13.0 }),
                this.taxRatesService.create(companyId, { name: 'TVA 7%', rate: 7.0 }),
                this.taxRatesService.create(companyId, { name: 'Exonéré', rate: 0.0 }),
            ]);
        }

        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            role: registerDto.role,
            companyId,
        });

        return user;
    }
}
