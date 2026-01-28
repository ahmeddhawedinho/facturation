import { Controller, Get, Put, Param, Request, UseGuards, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get('unread')
    async getUnread(@Request() req) {
        return this.notificationsService.findAllUnread(req.user.id, req.user.companyId);
    }

    @Put(':id/read')
    async markRead(@Request() req, @Param('id') id: string) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Post('mark-all-read')
    async markAllRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }
}
