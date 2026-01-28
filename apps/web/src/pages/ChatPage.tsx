import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Send, Hash, User, Shield, Eye, Lock, ArrowLeft, Trash2, Edit2, Users, Crown, X, Power, Activity, Briefcase } from 'lucide-react'

// Types
type Message = {
    id: string
    content: string
    senderId: string
    createdAt: string
    sender?: { firstName: string, lastName: string, role?: string }
    channel?: string
    receiverId?: string
}

type ChatUser = {
    id: string
    firstName: string
    lastName: string
    role: string
    isOnline?: boolean
}

export default function ChatPage() {
    const { user, token } = useAuthStore()
    const navigate = useNavigate()
    const [socket, setSocket] = useState<Socket | null>(null)

    // Data Stats
    const [users, setUsers] = useState<ChatUser[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [rooms, setRooms] = useState<{ id: string, name: string, description: string, hasAccess: boolean, hasUnread?: boolean }[]>([])

    // UI States
    const [activeChannel, setActiveChannel] = useState<string | null>('GENERAL')
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
    const [activeDirectId, setActiveDirectId] = useState<string | null>(null)
    const [inputText, setInputText] = useState('')
    const [isOfflineMode, setIsOfflineMode] = useState(false)
    const [showActivityLogs, setShowActivityLogs] = useState(false)
    const [activityLogs, setActivityLogs] = useState<any[]>([])
    const [socketConnected, setSocketConnected] = useState(false)

    // Modal Create Room
    const [showCreateRoom, setShowCreateRoom] = useState(false)
    const [newRoomData, setNewRoomData] = useState({ name: '', description: '', members: [] as string[] })

    // Admin Supervision
    const [isAuditMode, setIsAuditMode] = useState(false)
    const [auditTarget1, setAuditTarget1] = useState<string | null>(null)
    const [auditTarget2, setAuditTarget2] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Management State
    const [showManageMembers, setShowManageMembers] = useState(false)
    const [showRenameModal, setShowRenameModal] = useState(false)
    const [renameName, setRenameName] = useState('')



    const handleDeleteRoom = async () => {
        if (!activeRoomId || !confirm("Êtes-vous sûr de vouloir supprimer ce canal ? Tout l'historique sera perdu.")) return;
        try {
            await api.delete(`/chat/rooms/${activeRoomId}`);
            setActiveRoomId(null);
            const res = await api.get('/chat/rooms');
            setRooms(res.data);
        } catch (e) { console.error(e); }
    }

    const handleUpdateRoom = async () => {
        if (!activeRoomId || !renameName.trim()) return;
        try {
            await api.put(`/chat/rooms/${activeRoomId}`, { name: renameName });
            const res = await api.get('/chat/rooms');
            setRooms(res.data);
            setShowRenameModal(false);
        } catch (e) { console.error(e); }
    }

    const handleAddMember = async (userId: string) => {
        if (!activeRoomId) return;
        try {
            await api.post(`/chat/rooms/${activeRoomId}/members`, { userId });
            alert("Membre ajouté !"); // Simple feedback
        } catch (e) { console.error(e); }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!activeRoomId) return;
        try {
            await api.delete(`/chat/rooms/${activeRoomId}/members/${userId}`);
            alert("Membre retiré !");
        } catch (e) { console.error(e); }
    }



    const handleContactAccountant = async () => {
        try {
            const res = await api.post('/accountant-portal/init-company-chat')
            const channel = res.data

            const roomsRes = await api.get('/chat/rooms')
            setRooms(roomsRes.data)

            setActiveRoomId(channel.id)
            setActiveChannel(null)
            setActiveDirectId(null)
            setIsAuditMode(false)
        } catch (error) {
            console.error(error)
            alert("Impossible de contacter l'expert comptable. Vérifiez qu'un expert est bien lié à votre dossier.")
        }
    }

    const toggleOfflineMode = async () => {
        const newMode = !isOfflineMode;
        setIsOfflineMode(newMode);
        try {
            await api.post('/chat/status', { action: newMode ? 'DISCONNECT' : 'CONNECT' });
            if (newMode) socket?.disconnect();
            else socket?.connect();
        } catch (e) { console.error(e); }
    }

    const fetchActivityLogs = async () => {
        try {
            const res = await api.get('/chat/activity');
            setActivityLogs(res.data);
            setShowActivityLogs(true);
        } catch (e) { console.error(e); }
    }

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'owner';
    const activeUser = users.find(u => u.id === activeDirectId);
    const currentRoom = rooms.find(r => r.id === activeRoomId);

    // 1. Initialisation Socket & Users
    useEffect(() => {
        if (!token) return;

        const newSocket = io('http://localhost:3001/chat', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        newSocket.on('connect', () => {
            console.log('✅ Chat Connected');
            setIsOfflineMode(false);
            setSocketConnected(true);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            // Détecter si c'est un bloqueur de publicités
            if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || error.message.includes('xhr poll error')) {
                alert('⚠️ ERREUR DE CONNEXION\n\nLa messagerie ne peut pas se connecter. Cela est généralement causé par :\n\n1. Un bloqueur de publicités (AdBlock, uBlock Origin, etc.)\n2. Une extension de navigateur bloquant les WebSockets\n\nSolutions :\n- Désactivez temporairement votre bloqueur de publicités\n- Ajoutez ce site à la liste blanche\n- Essayez un autre navigateur');
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket disconnected:', reason);
            setSocketConnected(false);
            if (reason === 'io server disconnect') {
                // Le serveur a forcé la déconnexion, on reconnecte manuellement
                newSocket.connect();
            }
        });

        newSocket.on('userStatus', ({ userId, status }: { userId: string, status: string }) => {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isOnline: status === 'online' } : u));
        });

        newSocket.on('newMessage', (msg: any) => {
            console.log('📨 New message received:', msg);
            setMessages(prev => {
                if (isAuditMode) return prev;
                // Legacy Channel
                if (msg.channel && msg.channel === activeChannel) return [...prev, msg];
                // Private Room
                if (msg.channelId && msg.channelId === activeRoomId) return [...prev, msg];
                // Direct Message
                if (!msg.channel && !msg.channelId) {
                    if (activeDirectId && (msg.senderId === activeDirectId || (msg.senderId === user?.id && activeDirectId === msg.receiverId))) {
                        return [...prev, msg];
                    }
                }
                return prev;
            });

            // Mark Unread
            if (msg.channelId && msg.channelId !== activeRoomId) {
                setRooms(prev => prev.map(r => r.id === msg.channelId ? { ...r, hasUnread: true } : r));
            }
        });

        newSocket.on('error', (err: any) => {
            console.error("❌ Socket error", err);
            alert(`Erreur de messagerie: ${err.message || 'Erreur inconnue'}`);
        });

        setSocket(newSocket);

        // Fetch Initial Data
        api.get('/chat/users').then(res => setUsers(res.data)).catch(console.error);
        api.get('/chat/rooms').then(res => setRooms(res.data)).catch(console.error);

        return () => {
            console.log('🔌 Closing socket connection');
            newSocket.close();
        }
    }, [token, activeChannel, activeDirectId, activeRoomId, isAuditMode, user?.id]);

    // 2. Chargement Historique
    useEffect(() => {
        if (!user) return;
        setMessages([]);

        if (isAuditMode) {
            if (auditTarget1 && auditTarget2) {
                api.get(`/chat/audit/${auditTarget1}/${auditTarget2}`)
                    .then(res => setMessages(res.data))
                    .catch(() => setMessages([]));
            }
        } else {
            if (activeChannel) {
                api.get(`/chat/history/channel/${activeChannel}`).then(res => setMessages(res.data));
            } else if (activeRoomId) {
                const room = rooms.find(r => r.id === activeRoomId);
                if (room?.hasAccess) {
                    api.get(`/chat/rooms/${activeRoomId}/messages`).then(res => setMessages(res.data)).catch(() => setMessages([]));
                }
            } else if (activeDirectId) {
                api.get(`/chat/history/dm/${activeDirectId}`).then(res => setMessages(res.data));
            }
        }
    }, [activeChannel, activeDirectId, activeRoomId, isAuditMode, auditTarget1, auditTarget2, user, rooms]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: any) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || isAuditMode) return;

        // Vérifier que le socket est connecté
        if (!socketConnected) {
            alert('❌ Impossible d\'envoyer le message\n\nLa connexion au serveur de messagerie est perdue.\n\nVérifiez:\n- Le point à côté de "MESSAGERIE" doit être vert\n- Votre connexion internet\n- Que le serveur API est démarré');
            return;
        }

        // Vérifier qu'une cible est sélectionnée
        if (!activeChannel && !activeRoomId && !activeDirectId) {
            alert('❌ Aucune destination sélectionnée\n\nVeuillez sélectionner:\n- Un canal (#GENERAL, #ANNONCES)\n- Un canal privé\n- Un utilisateur pour un message direct');
            return;
        }

        const payload: any = { content: inputText };
        if (activeChannel) payload.channel = activeChannel;
        if (activeRoomId) payload.channelId = activeRoomId;
        if (activeDirectId) payload.receiverId = activeDirectId;

        console.log('📤 Sending message:', payload);
        socket.emit('sendMessage', payload);
        setInputText('');
    };

    const handleCreateRoom = async () => {
        if (!newRoomData.name) return;
        try {
            await api.post('/chat/rooms', {
                name: newRoomData.name,
                description: newRoomData.description,
                memberIds: newRoomData.members
            });
            setShowCreateRoom(false);
            setNewRoomData({ name: '', description: '', members: [] });
            // Refresh rooms
            const res = await api.get('/chat/rooms');
            setRooms(res.data);
        } catch (error) {
            alert("Erreur lors de la création");
        }
    }

    return (
        <div className="flex h-screen bg-card overflow-hidden font-sans">

            {/* SIDEBAR */}
            <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-app flex flex-col z-20 shadow-xl">
                {/* Header Sidebar */}
                <div className="p-4 border-b border-app flex items-center justify-between bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-muted transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <h2 className="font-black text-app text-lg tracking-tight">MESSAGERIE</h2>
                            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} title={socketConnected ? 'Connecté' : 'Déconnecté'}></div>
                        </div>
                    </div>
                    <div className="flex gap-1">

                        <button onClick={toggleOfflineMode} className={`p-2 rounded-xl transition-all ${isOfflineMode ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`} title={isOfflineMode ? "Se connecter" : "Se déconnecter"}>
                            <Power className="w-5 h-5" />
                        </button>
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setShowCreateRoom(true)}
                                    className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                    title="Nouveau Canal"
                                >
                                    <Hash className="w-5 h-5" />
                                </button>
                                <button onClick={fetchActivityLogs} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600" title="Logs Activité">
                                    <Activity className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => { setIsAuditMode(!isAuditMode); setMessages([]); }}
                                    className={`p-2 rounded-xl transition-all ${isAuditMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-gray-100 dark:bg-gray-800 text-muted hover:text-app'}`}
                                    title="Mode Supervision"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* List Filters / Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* CANAUX PUBLICS */}
                    {!isAuditMode && (
                        <div>
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 pl-2 opacity-70">Général</h3>
                            <div className="space-y-1">
                                {['GENERAL', 'ANNONCES'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setActiveChannel(c); setActiveRoomId(null); setActiveDirectId(null); setIsAuditMode(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeChannel === c ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1' : 'hover:bg-white dark:hover:bg-gray-800 text-app'}`}
                                    >
                                        <Hash className="w-4 h-4 opacity-70" />
                                        <span className="font-bold text-sm tracking-wide">#{c}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CANAUX PRIVÉS (Rooms) */}
                    {!isAuditMode && (
                        <div>
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 pl-2 opacity-70 flex items-center justify-between">
                                Canaux Privés
                            </h3>
                            <button
                                onClick={handleContactAccountant}
                                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all hover:bg-white dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 mb-3 border border-indigo-100 dark:border-indigo-800 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-sm block leading-none mb-1">Mon Expert</span>
                                    <span className="text-[9px] opacity-70 uppercase font-black tracking-wider">Accès Rapide</span>
                                </div>
                            </button>
                            <div className="space-y-1">
                                {rooms.map(room => (
                                    <button
                                        key={room.id}
                                        onClick={() => {
                                            setActiveRoomId(room.id);
                                            setActiveChannel(null);
                                            setActiveDirectId(null);
                                            setIsAuditMode(false);
                                            setRooms(prev => prev.map(r => r.id === room.id ? { ...r, hasUnread: false } : r));
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeRoomId === room.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1' : 'hover:bg-white dark:hover:bg-gray-800 text-app'}`}
                                    >
                                        <div className="relative">
                                            <Hash className="w-4 h-4 opacity-70" />
                                            {!room.hasAccess ? (
                                                <div className="absolute -top-1 -right-1">
                                                    <Lock className="w-2.5 h-2.5 text-rose-500" />
                                                </div>
                                            ) : room.hasUnread && (
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold text-sm tracking-wide truncate block">{room.name}</span>
                                            {room.description && <span className="text-[9px] opacity-60 truncate block">{room.description}</span>}
                                        </div>
                                    </button>
                                ))}
                                {rooms.length === 0 && <p className="text-xs text-muted pl-4 italic">Aucun canal privé</p>}
                            </div>
                        </div>
                    )}

                    {/* USERS */}
                    <div>
                        <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 pl-2 flex items-center gap-2 opacity-70">
                            {isAuditMode ? <><Shield className="w-3 h-3 text-rose-500" /> SUPERVISION</> : 'MESSAGES PRIVÉS'}
                        </h3>
                        <div className="space-y-1">
                            {users.filter(u => u.id !== user?.id).map(u => (
                                <div key={u.id}>
                                    {isAuditMode ? (
                                        // MODE AUDIT
                                        <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 border border-app mb-2 shadow-sm transition-all ${auditTarget1 === u.id ? 'ring-2 ring-rose-500 shadow-rose-500/10' : 'hover:scale-[1.02]'}`}>
                                            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setAuditTarget1(u.id)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-bold text-xs border border-rose-200 dark:border-rose-800">{u.firstName[0]}{u.lastName[0]}</div>
                                                    <span className="font-bold text-sm text-app">{u.firstName} {u.lastName}</span>
                                                </div>
                                            </div>
                                            {auditTarget1 === u.id && (
                                                <div className="pl-4 mt-3 pt-3 border-t border-app space-y-1">
                                                    <p className="text-[9px] text-muted uppercase font-black mb-2 opacity-50">Vers :</p>
                                                    {users.filter(other => other.id !== u.id).map(other => (
                                                        <button key={other.id} onClick={() => setAuditTarget2(other.id)} className={`w-full text-left text-xs px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${auditTarget2 === other.id ? 'bg-rose-500 text-white font-bold' : 'text-muted hover:bg-gray-50'}`}>
                                                            <span>{other.firstName} {other.lastName}</span>
                                                            <Eye className="w-3 h-3 opacity-50" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // MODE NORMAL
                                        <button
                                            onClick={() => { setActiveDirectId(u.id); setActiveChannel(null); setActiveRoomId(null); }}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all relative ${activeDirectId === u.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1' : 'hover:bg-white dark:hover:bg-gray-800 text-app'}`}
                                        >
                                            <div className="relative">
                                                <div className={`w-2.5 h-2.5 rounded-full absolute -right-0.5 -bottom-0.5 border-2 border-white dark:border-gray-900 transition-colors ${u.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-2 ring-white dark:ring-gray-800">{u.firstName[0]}{u.lastName[0]}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-bold text-sm block leading-none mb-1 truncate">{u.firstName} {u.lastName}</span>
                                                <span className="text-[9px] opacity-70 uppercase font-black tracking-wider">{u.role}</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 relative">
                {isAuditMode && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 animate-gradient-x z-20"></div>}

                {/* HEADER */}
                <div className="h-16 border-b border-app flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        {activeChannel || activeRoomId ? (
                            <>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg animate-in zoom-in-50 ${activeRoomId ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                                    {activeRoomId && currentRoom && !currentRoom.hasAccess ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-app text-lg tracking-tight">#{activeRoomId ? currentRoom?.name : activeChannel}</h3>
                                    <p className="text-xs text-muted font-bold flex items-center gap-1">
                                        {activeRoomId ? (currentRoom?.hasAccess ? 'Canal Privé' : 'Accès Restreint') : 'Canal Public'}
                                    </p>
                                </div>
                            </>
                        ) : activeDirectId || (isAuditMode && auditTarget1 && auditTarget2) ? (
                            <>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg animate-in zoom-in-50 ${isAuditMode ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`}>
                                    {isAuditMode ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-app text-lg tracking-tight">
                                        {isAuditMode ? `SUPERVISION` : (activeUser ? `${activeUser.firstName} ${activeUser.lastName}` : 'Utilisateur')}
                                    </h3>
                                    {!isAuditMode && <p className="text-xs text-emerald-500 font-bold">{activeUser?.isOnline ? 'En ligne' : 'Hors ligne'}</p>}
                                </div>
                            </>
                        ) : <p className="font-bold text-muted text-xs uppercase tracking-widest">Sélectionnez une discussion</p>}
                    </div>

                    {/* Admin Controls */}
                    {activeRoomId && currentRoom?.hasAccess && isAdmin && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => { setRenameName(currentRoom.name); setShowRenameModal(true); }} className="p-2 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Renommer">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => setShowManageMembers(true)} className="p-2 text-muted hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Gérer les membres">
                                <Users className="w-5 h-5" />
                            </button>
                            <button onClick={handleDeleteRoom} className="p-2 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Supprimer le canal">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* MESSAGES OR BLURRED VIEW */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide relative">
                    {/* ACCESS DENIED VIEW */}
                    {activeRoomId && currentRoom && !currentRoom.hasAccess && (
                        <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/30 dark:bg-gray-900/30 flex flex-col items-center justify-center p-8 text-center animate-in fade-in active:backdrop-blur-xl">
                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6 shadow-xl">
                                <Lock className="w-10 h-10 text-muted" />
                            </div>
                            <h2 className="text-2xl font-black text-app mb-2">Contenu Flouté</h2>
                            <p className="text-muted font-medium max-w-md">Vous n'avez pas l'autorisation de voir le contenu de ce canal privé. Seuls les membres invités peuvent participer.</p>
                            <div className="mt-8 grid grid-cols-2 gap-4 opacity-50 pointer-events-none select-none blur-sm">
                                {/* Fake Blurred Messages */}
                                <div className="col-span-2 flex justify-start"><div className="bg-white p-4 rounded-xl shadow w-2/3 h-12"></div></div>
                                <div className="col-span-2 flex justify-end"><div className="bg-blue-600 p-4 rounded-xl shadow w-1/2 h-16"></div></div>
                                <div className="col-span-2 flex justify-start"><div className="bg-white p-4 rounded-xl shadow w-3/4 h-20"></div></div>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && (!activeRoomId || (currentRoom && currentRoom.hasAccess)) && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Send className="w-10 h-10 text-gray-400 mb-4" />
                            <p className="text-sm font-bold uppercase">Aucun message</p>
                        </div>
                    )}

                    {/* Messages List */}
                    {messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.id;
                        const isMsgAdmin = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'owner';

                        const alignment = isAuditMode ? (msg.senderId === auditTarget1 ? 'justify-start' : 'justify-end') : (isMe ? 'justify-end' : 'justify-start');
                        const bubbleStyle = isAuditMode ? (msg.senderId === auditTarget1 ? 'bg-white' : 'bg-rose-50') : (isMe ? 'bg-blue-600 text-white' : (isMsgAdmin ? 'bg-amber-50 border-2 border-amber-400 shadow-md text-slate-800' : 'bg-white text-app'));

                        const showName = !isMe && (activeChannel || activeRoomId) && (i === 0 || messages[i - 1].senderId !== msg.senderId);

                        return (
                            <div key={msg.id} className={`flex ${alignment} animate-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[70%] text-sm p-4 rounded-2xl shadow-sm border border-transparent ${bubbleStyle}`}>
                                    {showName && !isAuditMode && (
                                        <div className="flex items-center gap-1 mb-1 opacity-70">
                                            {isMsgAdmin && <Crown className="w-3 h-3 text-amber-600 fill-amber-600" />}
                                            <p className="text-[10px] font-black uppercase">{msg.sender?.firstName}</p>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                                    <span className={`text-[9px] font-bold block mt-1.5 text-right opacity-50`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-app">
                    {(activeRoomId && currentRoom && !currentRoom.hasAccess) ? (
                        <div className="w-full py-4 text-center bg-gray-100 dark:bg-gray-800 rounded-xl text-muted font-bold text-sm flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" /> Lecture seule - Accès restreint
                        </div>
                    ) : isAuditMode ? (
                        <div className="w-full py-4 text-center text-rose-500 bg-rose-50 rounded-xl font-bold border-2 border-dashed border-rose-200">
                            MODE SUPERVISION - LECTURE SEULE
                        </div>
                    ) : (
                        <div className="relative flex items-center gap-2">
                            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                                placeholder="Écrivez votre message..."
                                className="w-full bg-gray-50 border-none rounded-xl py-4 pl-6 pr-14 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                disabled={!activeChannel && !activeDirectId && !activeRoomId}
                            />
                            <button type="submit" disabled={!inputText.trim()} className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </form>

                {/* MODAL CREATE ROOM */}
                {showCreateRoom && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-app">
                            <div className="p-6 border-b border-app bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                <h3 className="font-black text-xl text-app">Créer un Canal Privé</h3>
                                <button onClick={() => setShowCreateRoom(false)} className="text-muted hover:text-app">Fermer</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-muted mb-1">Nom du Canal</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 w-4 h-4 text-muted" />
                                        <input type="text" value={newRoomData.name} onChange={e => setNewRoomData({ ...newRoomData, name: e.target.value })} className="w-full pl-9 p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500" placeholder="Ex: Marketing, Projet X..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-muted mb-1">Description (Optionnel)</label>
                                    <textarea value={newRoomData.description} onChange={e => setNewRoomData({ ...newRoomData, description: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Objectif du canal..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-muted mb-2">Membres Autorisés</label>
                                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-xl p-2">
                                        {users.filter(u => u.id !== user?.id).map(u => (
                                            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newRoomData.members.includes(u.id)}
                                                    onChange={e => {
                                                        const newMembers = e.target.checked
                                                            ? [...newRoomData.members, u.id]
                                                            : newRoomData.members.filter(id => id !== u.id);
                                                        setNewRoomData({ ...newRoomData, members: newMembers });
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                    {u.firstName[0]}{u.lastName[0]}
                                                </div>
                                                <span className="text-sm font-bold text-app">{u.firstName} {u.lastName}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted mt-2 text-right">{newRoomData.members.length} membres sélectionnés (+ Vous)</p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-app bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowCreateRoom(false)} className="px-4 py-2 font-bold text-muted hover:text-app">Annuler</button>
                                <button onClick={handleCreateRoom} disabled={!newRoomData.name} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50">
                                    Créer le Canal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: RENAME */}
                {showRenameModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-app">
                                <h3 className="font-black text-xl text-app">Renommer le Canal</h3>
                            </div>
                            <div className="p-6">
                                <label className="block text-xs font-black uppercase text-muted mb-1">Nouveau Nom</label>
                                <input autoFocus type="text" value={renameName} onChange={e => setRenameName(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 font-bold" />
                            </div>
                            <div className="p-4 border-t border-app bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowRenameModal(false)} className="px-4 py-2 font-bold text-muted hover:text-app">Annuler</button>
                                <button onClick={handleUpdateRoom} disabled={!renameName.trim()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg">Enregistrer</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: MANAGE MEMBERS */}
                {showManageMembers && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-app flex justify-between items-center">
                                <h3 className="font-black text-xl text-app">Gérer les Membres</h3>
                                <button onClick={() => setShowManageMembers(false)}><X className="w-5 h-5 text-muted" /></button>
                            </div>
                            <div className="p-0 max-h-[60vh] overflow-y-auto">
                                {users.filter(u => u.id !== user?.id).map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-app">{u.firstName} {u.lastName}</p>
                                                <p className="text-[10px] uppercase font-black opacity-50">{u.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleAddMember(u.id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
                                                Ajouter
                                            </button>
                                            <button onClick={() => handleRemoveMember(u.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors">
                                                Retirer
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-gray-50 text-center">
                                <p className="text-xs text-muted">Utilisez les boutons pour gérer l'accès.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* OFFLINE OVERLAY */}
                {isOfflineMode && (
                    <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-gray-900/50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl border border-white/20">
                            <Power className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Vous êtes en mode Hors-ligne</h2>
                        <p className="text-white/70 font-medium max-w-md mb-8">Les messages sont masqués et vous ne recevrez pas de nouvelles notifications. Reconnectez-vous pour reprendre le travail.</p>
                        <button onClick={toggleOfflineMode} className="px-8 py-3 bg-white text-app rounded-xl font-black shadow-xl hover:scale-105 transition-transform">
                            Se reconnecter au service
                        </button>
                    </div>
                )}

                {/* MODAL: ACTIVITY LOGS */}
                {showActivityLogs && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-app flex justify-between items-center bg-gray-50">
                                <h3 className="font-black text-xl text-app flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Rapport d'Activité Journalier
                                </h3>
                                <button onClick={() => setShowActivityLogs(false)}><X className="w-5 h-5 text-muted hover:text-rose-500" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-black text-muted tracking-wider sticky top-0">
                                        <tr>
                                            <th className="p-4">Agent</th>
                                            <th className="p-4">Action</th>
                                            <th className="p-4">Horodatage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activityLogs.map((log, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-bold text-app">
                                                    {log.user.firstName} {log.user.lastName}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.action === 'CONNECT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {log.action === 'CONNECT' ? 'Connexion' : 'Déconnexion'}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-muted">
                                                    {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {activityLogs.length === 0 && (
                                    <div className="p-12 text-center text-muted font-medium">Aucune activité récente enregistrée.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
