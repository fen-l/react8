import type { QueryClient } from '@tanstack/react-query'
import type { AuthContextType } from './contexts/AuthContext'

export type RouterContext = {
    queryClient: QueryClient
    auth: AuthContextType
}