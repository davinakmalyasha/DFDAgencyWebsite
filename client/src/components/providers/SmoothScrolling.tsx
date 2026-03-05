"use client"

import { ReactLenis } from '@studio-freight/react-lenis'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Lenis types are incompatible with React 19 ReactNode
export function SmoothScrolling({ children }: { children: any }) {
    return (
        // @ts-expect-error - Lenis types clash with React 19 node definitions
        <ReactLenis root options={{ lerp: 0.04, duration: 2.0, smoothWheel: true, orientation: 'vertical', gestureOrientation: 'vertical', touchMultiplier: 2, infinite: false }}>
            {children}
        </ReactLenis>
    )
}
