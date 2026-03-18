"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

/**
 * Animation states for the floating CTA button.
 * Transitions: hidden → circle → pill (and reverse).
 * Hidden when inside the #final-cta viewport.
 */
type AnimationPhase = "hidden" | "circle" | "pill";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FloatingCTA() {
    const [isMounted, setIsMounted] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);
    const [isInteractive, setIsInteractive] = useState(false);
    const phaseRef = useRef<AnimationPhase>("hidden");
    const animatingRef = useRef(false);
    const controls = useAnimation();
    const textControls = useAnimation();

    // Mount guard
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Observe hero (don't show until user scrolls past it) and final-cta (hide when visible)
    useEffect(() => {
        if (!isMounted) return;

        let heroVisible = true;
        let finalCtaVisible = false;

        const updateVisibility = () => {
            setShouldShow(!heroVisible && !finalCtaVisible);
        };

        const heroObserver = new IntersectionObserver(
            ([entry]) => {
                heroVisible = entry.isIntersecting;
                updateVisibility();
            },
            { threshold: 0.3 }
        );

        const ctaObserver = new IntersectionObserver(
            ([entry]) => {
                finalCtaVisible = entry.isIntersecting;
                updateVisibility();
            },
            { threshold: 0.1 }
        );

        // Observe hero section - button stays hidden while hero is visible
        const hero = document.getElementById("hero-section") ?? document.querySelector("section");
        if (hero) heroObserver.observe(hero);

        // Observe final CTA - button hides when this comes into view
        const finalCta = document.getElementById("final-cta");
        if (finalCta) ctaObserver.observe(finalCta);

        return () => {
            heroObserver.disconnect();
            ctaObserver.disconnect();
        };
    }, [isMounted]);

    // Run entrance / exit animation sequence based on shouldShow
    const runEntrance = useCallback(async () => {
        if (animatingRef.current) return;
        animatingRef.current = true;
        phaseRef.current = "circle";

        // Step 1: Pop in as a circle
        await controls.start({
            y: 0,
            opacity: 1,
            scale: 1,
            width: 56,
            transition: { duration: 0.45, ease: EASE_OUT_EXPO },
        });
        setIsInteractive(true);

        // Check if we should still be showing
        if (!animatingRef.current) return;

        // Step 2: Expand to pill
        phaseRef.current = "pill";
        await controls.start({
            width: 240,
            transition: { duration: 0.45, ease: EASE_OUT_EXPO },
        });

        if (!animatingRef.current) return;

        // Step 3: Fade in text & arrow
        await textControls.start({
            opacity: 1,
            x: 0,
            transition: { duration: 0.25, ease: "easeOut" },
        });

        animatingRef.current = false;
    }, [controls, textControls]);

    const runExit = useCallback(async () => {
        animatingRef.current = true;
        setIsInteractive(false);

        // Step 1: Fade out text
        await textControls.start({
            opacity: 0,
            x: 10,
            transition: { duration: 0.15, ease: "easeIn" },
        });

        // Step 2: Shrink to circle
        phaseRef.current = "circle";
        await controls.start({
            width: 56,
            transition: { duration: 0.3, ease: EASE_OUT_EXPO },
        });

        // Step 3: Slide down and fade out
        phaseRef.current = "hidden";
        await controls.start({
            y: 80,
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3, ease: "easeIn" },
        });

        animatingRef.current = false;
    }, [controls, textControls]);

    useEffect(() => {
        if (!isMounted) return;

        if (shouldShow) {
            // Cancel any running exit and start entrance
            animatingRef.current = false;
            runEntrance();
        } else {
            // Cancel any running entrance and start exit
            animatingRef.current = false;
            runExit();
        }
    }, [shouldShow, isMounted, runEntrance, runExit]);

    if (!isMounted) return null;

    return (
        <motion.a
            href="https://wa.me/62895324350359?text=Hey%20im%20interested"
            target="_blank"
            rel="noopener noreferrer"
            animate={controls}
            initial={{ y: 80, opacity: 0, scale: 0.8, width: 56 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center h-14 bg-zinc-950 text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] cursor-pointer hover:bg-zinc-800 transition-colors duration-200 rounded-full overflow-hidden no-underline"
            style={{ pointerEvents: isInteractive ? "auto" : "none" }}
        >
            <MessageCircle className="w-5 h-5 text-white flex-shrink-0" />

            <motion.div
                animate={textControls}
                initial={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 ml-3 whitespace-nowrap"
            >
                <span className="font-bold text-sm tracking-widest uppercase">
                    Contact Us
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            </motion.div>
        </motion.a>
    );
}
