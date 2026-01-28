import { useAuthStore } from '../store/authStore'

/**
 * Hook pour vérifier si l'utilisateur a une permission spécifique
 */
export function usePermission(permission: string): boolean {
    const { user } = useAuthStore()

    // Les ADMIN ont toutes les permissions
    if (user?.role === 'ADMIN') {
        return true
    }

    // Agréger les permissions de l'utilisateur et de son rôle
    const userPermissions = user?.permissions || []
    const rolePermissions = user?.customRole?.permissions || []
    const allPermissions = [...userPermissions, ...rolePermissions]

    return allPermissions.includes(permission)
}

/**
 * Hook pour vérifier si l'utilisateur a au moins une des permissions
 */
export function useAnyPermission(permissions: string[]): boolean {
    const { user } = useAuthStore()

    // Les ADMIN ont toutes les permissions
    if (user?.role === 'ADMIN') {
        return true
    }

    // Agréger les permissions
    const userPermissions = user?.permissions || []
    const rolePermissions = user?.customRole?.permissions || []
    const allPermissions = [...userPermissions, ...rolePermissions]

    return permissions.some(p => allPermissions.includes(p))
}

/**
 * Hook pour vérifier si l'utilisateur a toutes les permissions
 */
export function useAllPermissions(permissions: string[]): boolean {
    const { user } = useAuthStore()

    // Les ADMIN ont toutes les permissions
    if (user?.role === 'ADMIN') {
        return true
    }

    // Agréger les permissions
    const userPermissions = user?.permissions || []
    const rolePermissions = user?.customRole?.permissions || []
    const allPermissions = [...userPermissions, ...rolePermissions]

    return permissions.every(p => allPermissions.includes(p))
}
