import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconBrain,
  IconShoppingCart,
  IconChartBar,
  IconShield,
  IconRocket,
  IconUsers,
  IconStar,
} from "@tabler/icons-react";

export default function BentoGridDemo() {
  return (
    <BentoGrid className="max-w-4xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={i === 3 || i === 6 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  );
}
const AIGradient = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 opacity-80"></div>
);

const ShoppingGradient = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 opacity-80"></div>
);

const AnalyticsGradient = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 opacity-80"></div>
);

const SecurityGradient = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 opacity-80"></div>
);

const DefaultGradient = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);
const items = [
  {
    title: "Smart Product Discovery",
    description: "Advanced search and filtering to help you find exactly what you're looking for.",
    header: <AIGradient />,
    icon: <IconBrain className="h-4 w-4 text-blue-500" />,
  },
  {
    title: "Seamless Shopping Experience",
    description: "Intuitive marketplace interface with smooth browsing and purchasing flow.",
    header: <ShoppingGradient />,
    icon: <IconShoppingCart className="h-4 w-4 text-green-500" />,
  },
  {
    title: "Real-time Analytics",
    description: "Track market trends and monitor your transactions with live blockchain data.",
    header: <AnalyticsGradient />,
    icon: <IconChartBar className="h-4 w-4 text-orange-500" />,
  },
  {
    title: "Blockchain Security & Trust",
    description:
      "Secure transactions and verified sellers on a decentralized platform you can trust.",
    header: <SecurityGradient />,
    icon: <IconShield className="h-4 w-4 text-indigo-500" />,
  },
  {
    title: "Lightning Fast Performance",
    description: "Optimized for speed with instant search and rapid transaction processing.",
    header: <DefaultGradient />,
    icon: <IconRocket className="h-4 w-4 text-purple-500" />,
  },
  {
    title: "Community Driven",
    description: "Join a thriving community of buyers and sellers shaping the future of commerce.",
    header: <DefaultGradient />,
    icon: <IconUsers className="h-4 w-4 text-cyan-500" />,
  },
  {
    title: "Quality Assurance",
    description: "Verified product quality and seller ratings ensure you get the best value.",
    header: <DefaultGradient />,
    icon: <IconStar className="h-4 w-4 text-yellow-500" />,
  },
];
