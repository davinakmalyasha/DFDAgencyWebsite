"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
    const [isMounted, setIsMounted] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [cursorText, setCursorText] = useState("");
    const styleInjectedRef = useRef(false);

    const hasText = cursorText.length > 0;
    const cursorSize = hasText ? 100 : isHovering ? 60 : 16;

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
    const smoothMouseX = useSpring(mouseX, smoothOptions);
    const smoothMouseY = useSpring(mouseY, smoothOptions);

    useEffect(() => {
        setIsMounted(true);

        // Inject cursor-hiding style only once
        if (!styleInjectedRef.current && typeof document !== "undefined") {
            styleInjectedRef.current = true;
            document.body.style.cursor = "none";
            const style = document.createElement("style");
            style.setAttribute("data-custom-cursor", "true");
            style.innerHTML = `* { cursor: none !important; }`;
            document.head.appendChild(style);
        }

        const manageMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX - cursorSize / 2);
            mouseY.set(e.clientY - cursorSize / 2);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Check for data-cursor-text on the element or its ancestors
            const cursorTextEl = target.closest("[data-cursor-text]") as HTMLElement | null;
            if (cursorTextEl) {
                setCursorText(cursorTextEl.getAttribute("data-cursor-text") || "");
                setIsHovering(true);
                return;
            }

            // Reset cursor text
            setCursorText("");

            // Check if hovering over interactive elements
            if (
                target.tagName.toLowerCase() === "a" ||
                target.tagName.toLowerCase() === "button" ||
                target.closest("a") ||
                target.closest("button") ||
                target.closest('[role="button"]') ||
                target.classList.contains("cursor-pointer")
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener("mousemove", manageMouseMove);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", manageMouseMove);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, [cursorSize, mouseX, mouseY]);

    if (!isMounted) return null;

    return (
        <motion.div
            style={{
                left: smoothMouseX,
                top: smoothMouseY,
            }}
            animate={{
                width: cursorSize,
                height: cursorSize,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed pointer-events-none z-[9999] rounded-full mix-blend-difference bg-white flex items-center justify-center"
        >
            {hasText && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="text-[10px] font-black tracking-widest uppercase text-black mix-blend-difference select-none"
                >
                    {cursorText}
                </motion.span>
            )}
        </motion.div>
    );
}
