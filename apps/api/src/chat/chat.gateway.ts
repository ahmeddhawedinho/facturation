import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    // Map simple pour suivre les utilisateurs en ligne : userId -> socketId
    private onlineUsers = new Map<string, string>();

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Auth : Token passé dans handshake.auth.token ou query.token
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (!token) { client.disconnect(); return; }

            const payload = this.jwtService.decode(token) as any; // Ou verify si on a le secret dispo
            if (!payload || !payload.sub) { client.disconnect(); return; }

            const userId = payload.sub;
            const companyId = payload.companyId; // Assumons que le JWT contient companyId

            // Stocker infos sur le socket
            client.data.user = { id: userId, companyId };

            // Joindre les rooms
            client.join(`company_${companyId}`); // Pour Broadcasts / Canaux Publics
            client.join(`user_${userId}`);       // Pour DMs

            // Joindre les canaux privés
            const channels = await this.chatService.getUserChannels(companyId, userId);
            for (const ch of channels) {
                if (ch.hasAccess) {
                    client.join(`room_${ch.id}`);
                }
            }

            // Tracking Online
            this.onlineUsers.set(userId, client.id);

            // Notifier la compagnie que User est en ligne
            this.server.to(`company_${companyId}`).emit('userStatus', { userId, status: 'online' });

            console.log(`Client connected: ${userId} (${companyId})`);
        } catch (e) {
            console.error("Socket auth error", e);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        if (client.data.user) {
            const { id, companyId } = client.data.user;
            this.onlineUsers.delete(id);
            this.server.to(`company_${companyId}`).emit('userStatus', { userId: id, status: 'offline' });
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
        try {
            const user = client.data.user;
            if (!user) return;

            // Persister
            const msg = await this.chatService.saveMessage(user.companyId, user.id, payload);

            // Diffuser
            if (payload.channelId) {
                // Canal Privé (Secure Room)
                this.server.to(`room_${payload.channelId}`).emit('newMessage', msg);
            } else if (payload.channel) {
                // Public Channel
                this.server.to(`company_${user.companyId}`).emit('newMessage', msg);
            } else if (payload.receiverId) {
                // DM
                this.server.to(`user_${payload.receiverId}`).emit('newMessage', msg);
                this.server.to(`user_${user.id}`).emit('newMessage', msg);
            }
        } catch (e) {
            console.error("Handle Message Error", e);
            client.emit('error', { message: e.message || "Erreur d'envoi" });
        }
    }

    @SubscribeMessage('typing')
    handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { receiverId?: string, channel?: string, channelId?: string }) {
        const user = client.data.user;
        if (payload.channelId) {
            client.to(`room_${payload.channelId}`).emit('typing', { userId: user.id, channelId: payload.channelId });
        } else if (payload.channel) {
            client.to(`company_${user.companyId}`).emit('typing', { userId: user.id, channel: payload.channel });
        } else if (payload.receiverId) {
            client.to(`user_${payload.receiverId}`).emit('typing', { userId: user.id });
        }
    }
}
