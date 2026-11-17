"use client"

import { ReactLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Routes where smooth scrolling should be disabled
const DISABLED_ROUTES = ['/order', '/track', '/admin']

export function SmoothScrolling({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isDisabled = DISABLED_ROUTES.some((route) => pathname.startsWith(route))

    if (isDisabled) {
        return <>{children}</>
    }

    return (
        <ReactLenis root options={{ lerp: 0.04, duration: 2.0, smoothWheel: true, orientation: 'vertical', gestureOrientation: 'vertical', touchMultiplier: 2, infinite: false }}>
            {children}
        </ReactLenis>
    )
}
