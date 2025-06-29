"use client";

import type { NextPage } from "next";
import Image from "next/image";
import LampDemo from "@/components/lamp-demo";
import BentoGridDemo from "@/components/bento-grid-demo";
import ProfileCard from "@/components/ProfileCard";

const Home: NextPage = () => {

  return (
    <>
      <div className="flex justify-center py-8 bg-base-300">
        <Image
          src="/Newlogo.png"
          alt="ChainCommerce Logo"
          width={150}
          height={50}
          priority
        />
      </div>
      <LampDemo />
      <div className="py-20 px-4 bg-base-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-base-content mb-4">
              Explore Our Features
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Discover the power of blockchain technology and innovative decentralized shopping experiences
            </p>
          </div>
          <BentoGridDemo />
        </div>
      </div>

      {/* Team Profile Cards Section */}
      <div className="py-20 px-4 bg-base-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-base-content mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              The innovative minds behind ChainCommerce, building the future of decentralized commerce
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Ojas Arora Profile Card */}
            <div className="flex justify-center">
              <ProfileCard
                name="Ojas Arora"
                title="Full Stack Web3 Dev"
                handle="ojasarora"
                status="Building the Future"
                contactText="Connect"
                avatarUrl="/ojas-avatar.jpg"
                miniAvatarUrl="/ojas-avatar.jpg"
                showUserInfo={true}
                enableTilt={true}
                className="ojas-card"
                onContactClick={() => window.open('https://www.linkedin.com/in/ojas-arora-b62430231/', '_blank')}
              />
            </div>

            {/* Karan Dhillon Profile Card */}
            <div className="flex justify-center">
              <ProfileCard
                name="Karan Dhillon"
                title="AI Engineer"
                handle="karandhillon"
                status="AI Innovation"
                contactText="Connect"
                avatarUrl="/karan-avatar.jpg"
                miniAvatarUrl="/karan-avatar.jpg"
                showUserInfo={true}
                enableTilt={true}
                onContactClick={() => window.open('https://www.linkedin.com/in/karandhillon05/', '_blank')}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
