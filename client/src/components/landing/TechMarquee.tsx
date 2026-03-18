"use client";

import { useRef } from "react";
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useVelocity,
    useAnimationFrame
} from "framer-motion";
import { wrap } from "@motionone/utils";

interface ParallaxTextProps {
    children: string;
    baseVelocity: number;
}

function ParallaxText({ children, baseVelocity = 100 }: ParallaxTextProps) {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400
    });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false
    });

    const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

    const directionFactor = useRef<number>(1);
    useAnimationFrame((t, delta) => {
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

        if (velocityFactor.get() < 0) {
            directionFactor.current = -1;
        } else if (velocityFactor.get() > 0) {
            directionFactor.current = 1;
        }

        moveBy += directionFactor.current * moveBy * velocityFactor.get();
        baseX.set(baseX.get() + moveBy);
    });

    return (
        <div className="parallax overflow-hidden tracking-tighter leading-[0.8] m-0 whitespace-nowrap flex flex-nowrap">
            <motion.div className="scroller font-black tracking-widest text-2xl lg:text-3xl uppercase flex whitespace-nowrap flex-nowrap" style={{ x }}>
                <span className="block mr-12 text-zinc-300">{children} </span>
                <span className="block mr-12 text-zinc-300">{children} </span>
                <span className="block mr-12 text-zinc-300">{children} </span>
                <span className="block mr-12 text-zinc-300">{children} </span>
            </motion.div>
        </div>
    );
}

export function TechMarquee() {
    return (
        <div className="w-full border-y border-zinc-200/50 py-8 bg-zinc-50 overflow-hidden relative flex flex-col gap-4">
            <ParallaxText baseVelocity={2}>NEXT.JS &mdash; REACT &mdash; TYPESCRIPT &mdash; VERCEL &mdash; RENDER &mdash; CLOUDINARY &mdash; MIDTRANS &mdash; PRISMA &mdash; TAILWIND &mdash; OPENAI &mdash;</ParallaxText>

            {/* Fade edges */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-zinc-50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-zinc-50 to-transparent z-10 pointer-events-none"></div>
        </div>
    );
}
