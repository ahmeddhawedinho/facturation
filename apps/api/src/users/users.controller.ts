import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    @Roles('ADMIN' as any)
    async create(@Request() req, @Body() createData: any) {
        const hashedPassword = await bcrypt.hash(createData.password, 10);
        return this.usersService.create({
            ...createData,
            password: hashedPassword,
            companyId: req.user.companyId,
        });
    }

    @Get()
    @Roles('ADMIN' as any)
    async findAll(@Request() req) {
        return this.usersService.findAll(req.user.companyId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Put('profile/change-password')
    async changePassword(@Request() req, @Body() data: any) {
        const userId = req.user.id;
        // Verify old password
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new Error('User not found'); // Should be handled by exception filter or standard NestJS exceptions
        }

        // If the user was just created or migrated and has no password (edge case), or normal flow
        const isMatch = await bcrypt.compare(data.oldPassword, user.password);
        if (!isMatch) {
            // In a real app use specialized HttpException
            throw new Error('Ancien mot de passe incorrect');
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        return this.usersService.update(userId, { password: hashedPassword });
    }

    @Put(':id')
    @Roles('ADMIN' as any)
    async update(@Param('id') id: string, @Body() updateData: any) {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        return this.usersService.update(id, updateData);
    }

    @Delete(':id')
    @Roles('ADMIN' as any)
    async delete(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
