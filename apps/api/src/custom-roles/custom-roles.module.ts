import { Module } from '@nestjs/common';
import { CustomRolesService } from './custom-roles.service';
import { CustomRolesController } from './custom-roles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CustomRolesController],
    providers: [CustomRolesService],
    exports: [CustomRolesService],
})
export class CustomRolesModule { }
