"use client";

import type { NextPage } from "next";
import Image from "next/image";
import LampDemo from "@/components/lamp-demo";
import BentoGridDemo from "@/components/bento-grid-demo";

const Home: NextPage = () => {

  return (
    <>
      <div className="flex justify-center py-8 bg-slate-950">
        <Image
          src="/chaincommerce_logo.png"
          alt="ChainCommerce Logo"
          width={300}
          height={100}
          priority
        />
      </div>
      <LampDemo />
      <div className="py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Explore Our Features
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Discover the power of blockchain technology and innovative decentralized shopping experiences
            </p>
          </div>
          <BentoGridDemo />
        </div>
      </div>
    </>
  );
};

export default Home;
