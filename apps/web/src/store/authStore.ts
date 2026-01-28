import { create } from 'zustand'
import api from '../lib/api'

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    companyId?: string
    permissions?: string[]
    customRole?: {
        id: string
        name: string
        permissions: string[]
    }
}

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (data: any) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isLoading: false,

    login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
            const response = await api.post('/auth/login', { email, password })
            const { access_token, user } = response.data

            localStorage.setItem('token', access_token)
            localStorage.setItem('user', JSON.stringify(user))
            set({ user, token: access_token, isLoading: false })
        } catch (error) {
            set({ isLoading: false })
            throw error
        }
    },

    register: async (data: any) => {
        set({ isLoading: true })
        try {
            await api.post('/auth/register', data)
            set({ isLoading: false })
        } catch (error) {
            set({ isLoading: false })
            throw error
        }
    },

    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null })
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            localStorage.removeItem('user')
            set({ user: null, token: null })
            return
        }

        try {
            const response = await api.post('/auth/me')
            localStorage.setItem('user', JSON.stringify(response.data))
            set({ user: response.data })
        } catch (error) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            set({ user: null, token: null })
        }
    },
}))
