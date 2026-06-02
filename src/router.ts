import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { RouterContext } from './router-context'

export const router = createRouter({
    routeTree,
    context: {} as RouterContext,
})