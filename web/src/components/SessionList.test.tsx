import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '@/lib/i18n-context'
import type { SessionSummary } from '@/types/api'
import { SessionList } from './SessionList'

function createSession(options: {
    id: string
    active: boolean
    name: string
    path: string
    updatedAt: number
}): SessionSummary {
    return {
        id: options.id,
        active: options.active,
        thinking: false,
        activeAt: options.updatedAt,
        updatedAt: options.updatedAt,
        metadata: {
            name: options.name,
            path: options.path,
            flavor: 'codex',
        },
        todoProgress: null,
        pendingRequestsCount: 0,
    }
}

function renderWithProviders(sessions: SessionSummary[]) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    return render(
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <SessionList
                    sessions={sessions}
                    onSelect={vi.fn()}
                    onNewSession={vi.fn()}
                    onRefresh={vi.fn()}
                    isLoading={false}
                    renderHeader={false}
                    api={null}
                />
            </I18nProvider>
        </QueryClientProvider>
    )
}

describe('SessionList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        const localStorageMock = {
            getItem: vi.fn(() => 'en'),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    })

    it('auto-collapses offline sessions and reveals them on demand', () => {
        const sessions = [
            createSession({
                id: 'online-1',
                active: true,
                name: 'Online Session',
                path: '/repo/demo',
                updatedAt: 1_700_000_100,
            }),
            createSession({
                id: 'offline-1',
                active: false,
                name: 'Offline Session',
                path: '/repo/demo',
                updatedAt: 1_700_000_000,
            }),
        ]

        renderWithProviders(sessions)

        expect(screen.getByText('Online Session')).toBeInTheDocument()
        expect(screen.queryByText('Offline Session')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /offline/i }))

        expect(screen.getByText('Offline Session')).toBeInTheDocument()
    })
})
