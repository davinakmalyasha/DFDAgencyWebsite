"use client"

import { ReactLenis } from '@studio-freight/react-lenis'
import { usePathname } from 'next/navigation'

// Routes where smooth scrolling should be disabled
const DISABLED_ROUTES = ['/order', '/track', '/admin']

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Lenis types are incompatible with React 19 ReactNode
export function SmoothScrolling({ children }: { children: any }) {
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
