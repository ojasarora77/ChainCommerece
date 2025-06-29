"use client";
import React from "react";
import { motion } from "motion/react";
import { LampContainer } from "@/components/ui/lamp";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export default function LampDemo() {
  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-base-content/80 to-base-content/60 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Building the future <br /> of shopping
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.8,
          duration: 0.6,
          ease: "easeInOut",
        }}
        className="mt-12 flex justify-center"
      >
        <div className="scale-125 hover:scale-150 transition-transform duration-300">
          <RainbowKitCustomConnectButton />
        </div>
      </motion.div>
    </LampContainer>
  );
}
