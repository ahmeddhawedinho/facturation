import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: [
            'http://localhost:5173',
            'https://test.danacreativeagency.com'
        ],
        credentials: true
    },
    namespace: 'chat',
    transports: ['websocket', 'polling']
})
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
            console.log('🔌 New socket connection attempt:', client.id);

            // Auth : Token passé dans handshake.auth.token ou query.token
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (!token) {
                console.error('❌ No token provided');
                client.disconnect();
                return;
            }

            const payload = this.jwtService.decode(token) as any; // Ou verify si on a le secret dispo
            console.log('🔑 JWT payload:', { sub: payload?.sub, companyId: payload?.companyId });

            if (!payload || !payload.sub) {
                console.error('❌ Invalid token payload');
                client.disconnect();
                return;
            }

            const userId = payload.sub;
            const companyId = payload.companyId; // Assumons que le JWT contient companyId

            console.log('👤 User connecting:', { userId, companyId });

            // Stocker infos sur le socket
            client.data.user = { id: userId, companyId };

            // Joindre les rooms
            client.join(`company_${companyId}`); // Pour Broadcasts / Canaux Publics
            client.join(`user_${userId}`);       // Pour DMs

            // Joindre les canaux privés
            const channels = await this.chatService.getUserChannels(companyId, userId);
            console.log(`📢 User has access to ${channels.length} channels`);
            for (const ch of channels) {
                if (ch.hasAccess) {
                    client.join(`room_${ch.id}`);
                }
            }

            // Tracking Online
            this.onlineUsers.set(userId, client.id);

            // Notifier la compagnie que User est en ligne
            this.server.to(`company_${companyId}`).emit('userStatus', { userId, status: 'online' });

            console.log(`✅ Client connected successfully: ${userId} (${companyId})`);
        } catch (e) {
            console.error("❌ Socket auth error:", e);
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
            console.log('📨 Received sendMessage event from client:', client.id);
            console.log('📦 Payload:', payload);

            const user = client.data.user;
            console.log('👤 User data from socket:', user);

            if (!user) {
                console.error('❌ No user data on socket');
                client.emit('error', { message: "Utilisateur non authentifié" });
                return;
            }

            // Persister
            console.log('💾 Calling saveMessage with:', { companyId: user.companyId, userId: user.id });
            const msg = await this.chatService.saveMessage(user.companyId, user.id, payload);
            console.log('✅ Message saved:', msg.id);

            // Diffuser
            if (payload.channelId) {
                // Canal Privé (Secure Room)
                console.log(`📢 Broadcasting to room_${payload.channelId}`);
                this.server.to(`room_${payload.channelId}`).emit('newMessage', msg);
            } else if (payload.channel) {
                // Public Channel
                console.log(`📢 Broadcasting to company_${user.companyId} (channel: ${payload.channel})`);
                this.server.to(`company_${user.companyId}`).emit('newMessage', msg);
            } else if (payload.receiverId) {
                // DM
                console.log(`📢 Sending DM to user_${payload.receiverId} and user_${user.id}`);
                this.server.to(`user_${payload.receiverId}`).emit('newMessage', msg);
                this.server.to(`user_${user.id}`).emit('newMessage', msg);
            }

            console.log('✅ Message broadcasted successfully');
        } catch (e) {
            console.error("❌ Handle Message Error:", e);
            console.error("❌ Error stack:", e.stack);
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
