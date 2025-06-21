import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <DebugContracts />
      <div className="text-center mt-8 bg-slate-800 p-10 text-white">
        <h1 className="text-4xl my-0">Debug Contracts</h1>
        <p className="text-slate-300">
          You can debug & interact with your deployed contracts here.
          <br /> Check{" "}
          <code className="italic bg-slate-700 text-slate-200 font-bold [word-spacing:-0.5rem] px-1">
            packages / nextjs / app / debug / page.tsx
          </code>{" "}
        </p>
      </div>
    </div>
  );
};

export default Debug;
