import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get('users')
    async getUsers(@Request() req) {
        return this.chatService.getCompanyUsers(req.user.companyId);
    }

    @Get('history/channel/:name')
    async getChannelHistory(@Request() req, @Param('name') name: string) {
        return this.chatService.getChannelMessages(req.user.companyId, name);
    }

    @Get('history/dm/:userId')
    async getDmHistory(@Request() req, @Param('userId') otherId: string) {
        // Marquer comme lu au passage
        await this.chatService.markAsRead(req.user.companyId, req.user.id, otherId);
        return this.chatService.getDirectMessages(req.user.companyId, req.user.id, otherId);
    }

    // --- ADMIN SUPERVISION ---
    @Get('audit/:user1/:user2')
    async getAuditHistory(@Request() req, @Param('user1') u1: string, @Param('user2') u2: string) {
        return this.chatService.getAuditLog(req.user.companyId, req.user.id, u1, u2);
    }

    // --- PRIVATE CHANNELS ---

    @Post('rooms')
    async createRoom(@Request() req, @Body() body: { name: string, description: string, memberIds: string[] }) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'owner') {
            // Admin check
        }
        return this.chatService.createChannel(req.user.companyId, req.user.id, body.name, body.description, body.memberIds);
    }

    @Get('rooms')
    async getRooms(@Request() req) {
        return this.chatService.getUserChannels(req.user.companyId, req.user.id);
    }

    @Get('rooms/:id/messages')
    async getRoomMessages(@Request() req, @Param('id') id: string) {
        await this.chatService.markChannelRead(id, req.user.id);
        return this.chatService.getCustomChannelMessages(id, req.user.id);
    }

    @Get('activity')
    async getActivityLogs(@Request() req) {
        return this.chatService.getCompanyActivityLogs(req.user.companyId, req.user.id);
    }

    @Post('status')
    async toggleStatus(@Request() req, @Body() body: { action: 'CONNECT' | 'DISCONNECT' }) {
        return this.chatService.logActivity(req.user.id, req.user.companyId, body.action);
    }

    @Post('rooms/:id/read')
    async markRoomRead(@Request() req, @Param('id') id: string) {
        return this.chatService.markChannelRead(id, req.user.id);
    }

    @Post('rooms/:id/members')
    async addRoomMember(@Request() req, @Param('id') id: string, @Body() body: { userId: string }) {
        return this.chatService.addMember(id, body.userId);
    }

    @Delete('rooms/:id/members/:userId')
    async removeRoomMember(@Request() req, @Param('id') id: string, @Param('userId') userId: string) {
        return this.chatService.removeMember(id, userId);
    }

    @Put('rooms/:id')
    async updateRoom(@Request() req, @Param('id') id: string, @Body() body: { name: string }) {
        return this.chatService.updateChannel(id, body.name);
    }

    @Delete('rooms/:id')
    async deleteRoom(@Request() req, @Param('id') id: string) {
        return this.chatService.deleteChannel(id);
    }
}
