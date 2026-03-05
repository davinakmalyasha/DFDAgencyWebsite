"use client";

import { Globe, Linkedin, Mail, Twitter, Code2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function TeamSection() {
    const team = [
        {
            name: "David Ross",
            role: "Hustler / CEO",
            image: "https://i.pravatar.cc/300?img=11",
            socials: [
                { icon: <Globe className="w-4 h-4" />, link: "#" },
                { icon: <Linkedin className="w-4 h-4" />, link: "#" },
            ]
        },
        {
            name: "Sarah Miller",
            role: "Hipster / CDO",
            image: "https://i.pravatar.cc/300?img=47",
            socials: [
                { icon: <Twitter className="w-4 h-4" />, link: "#" },
                { icon: <Mail className="w-4 h-4" />, link: "#" },
            ]
        },
        {
            name: "Alex Chen",
            role: "Hacker / CTO",
            image: "https://i.pravatar.cc/300?img=12",
            socials: [
                { icon: <Code2 className="w-4 h-4" />, link: "#" },
                { icon: <Globe className="w-4 h-4" />, link: "#" },
            ]
        }
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" },
        },
    };

    return (
        <section className="py-32 bg-white border-b border-zinc-200/50">
            <div className="mx-auto w-[90%] max-w-[1024px]">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center mb-24"
                >
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-6 block">
                        THE BRAINS BEHIND DFD
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-zinc-950 mb-8">
                        Our leadership team.
                    </h2>
                    <p className="text-zinc-500 text-lg leading-relaxed max-w-xl">
                        Meet the visionaries, designers, and engineers pushing the boundaries of digital experiences.
                    </p>
                </motion.div>

                {/* Team Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 mb-32"
                >
                    {team.map((member, i) => (
                        <motion.div variants={itemVariants} key={i} className="flex flex-col items-center text-center group">
                            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden mb-8 border-4 border-zinc-50 shadow-xl group-hover:scale-105 transition-transform duration-500 relative">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>

                            <h3 className="text-2xl font-black tracking-tight text-zinc-950 mb-2">
                                {member.name}
                            </h3>
                            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-6">
                                {member.role}
                            </p>

                            <div className="flex items-center gap-4">
                                {member.socials.map((social, j) => (
                                    <a
                                        key={j}
                                        href={social.link}
                                        className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:border-zinc-950 transition-colors"
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Join CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-zinc-50 rounded-3xl border border-zinc-200/50"
                >
                    <div>
                        <h3 className="text-2xl font-black tracking-tight text-zinc-950 mb-2">
                            Join the collective.
                        </h3>
                        <p className="text-sm text-zinc-500">
                            We&apos;re always looking for talented misfits to join our ranks.
                        </p>
                    </div>
                    <button className="px-8 py-4 rounded-full font-bold bg-zinc-950 text-white hover:bg-zinc-800 hover:scale-105 transition-all duration-300 whitespace-nowrap text-sm">
                        SEE OPENINGS
                    </button>
                </motion.div>

            </div>
        </section>
    );
}
