"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export function Magnetic({ children, intensity = 0.5 }: { children: React.ReactNode, intensity?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isIgnoring = useRef(false);

    const reset = useCallback(() => {
        setPosition({ x: 0, y: 0 });
    }, []);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isIgnoring.current) return;
        
        const target = ref.current;
        if (!target) return;

        const { clientX, clientY } = e;
        const { height, width, left, top } = target.getBoundingClientRect();

        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        setPosition({ x: middleX * intensity, y: middleY * intensity });
    };

    const handleInteractionStart = () => {
        reset();
        isIgnoring.current = true;
        // Lock magnetic updates during transition or click action
        setTimeout(() => {
            isIgnoring.current = false;
        }, 300); // Increased lock duration for modal stability
    };

    // Global watchdog: Ensures element snaps back even if mouse move is too fast or blocked by backdrops
    useEffect(() => {
        const handleGlobalPointer = (e: PointerEvent) => {
            if (!ref.current || isIgnoring.current) return;
            
            const { clientX, clientY } = e;
            const { left, top, width, height } = ref.current.getBoundingClientRect();
            
            // If pointer is far outside the target element's bounds, force a reset
            const threshold = 100;
            if (
                clientX < left - threshold || 
                clientX > left + width + threshold || 
                clientY < top - threshold || 
                clientY > top + height + threshold
            ) {
                reset();
            }
        };

        window.addEventListener("pointermove", handleGlobalPointer);
        window.addEventListener("pointerup", () => {
             // Ensure reset on release in case of complex drag/click interactions
             reset();
        });
        
        return () => {
            window.removeEventListener("pointermove", handleGlobalPointer);
            window.removeEventListener("pointerup", reset);
        };
    }, [reset]);

    const { x, y } = position;

    return (
        <div
            style={{ position: "relative", display: "inline-block" }}
            ref={ref}
            onPointerMove={handlePointerMove}
            onPointerLeave={reset}
            onPointerDown={handleInteractionStart}
        >
            <motion.div
                animate={{ x, y }}
                transition={{ type: "spring", stiffness: 200, damping: 10, mass: 0.1 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
