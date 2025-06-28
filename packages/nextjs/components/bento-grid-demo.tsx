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
    <BentoGrid className="max-w-6xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={cn(
            // Blockchain Security - large central feature (spans 2x2)
            i === 3 && "md:col-span-2 md:row-span-2",
            // Quality Assurance - wide bottom section (spans 2x1) 
            i === 6 && "md:col-span-2",
            // Community Driven - tall section to match Real-time Analytics (spans 1x2)
            i === 5 && "md:col-span-1 md:row-span-2",
            // Default single cell for others
            (i === 0 || i === 1 || i === 2 || i === 4) && "md:col-span-1 md:row-span-1"
          )}
        />
      ))}
    </BentoGrid>
  );
}
// Gradient components removed to fix unused variable warnings
const items = [
  {
    title: "Smart Product Discovery",
    description: "Advanced search and filtering to help you find exactly what you're looking for.",
    header: (
      <div className="h-full w-full min-h-[120px] relative overflow-hidden rounded-xl">
        <img 
          src="https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Product Discovery" 
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconBrain className="h-4 w-4 text-blue-500" />,
  },
  {
    title: "Seamless Shopping Experience",
    description: "Intuitive marketplace interface with smooth browsing and purchasing flow.",
    header: (
      <div className="h-full w-full min-h-[120px] relative overflow-hidden rounded-xl">
        <img 
          src="https://plus.unsplash.com/premium_photo-1681488350342-19084ba8e224?q=80&w=2888&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconShoppingCart className="h-4 w-4 text-green-500" />,
  },
  {
    title: "Real-time Analytics",
    description: "Track market trends and monitor your transactions with live blockchain data.",
    header: (
      <div className="h-full w-full min-h-[120px] relative overflow-hidden rounded-xl">
        <img 
          src="https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Analytics" 
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconChartBar className="h-4 w-4 text-orange-500" />,
  },
  {
    title: "Blockchain Security & Trust",
    description:
      "Secure transactions and verified sellers on a decentralized platform you can trust.",
    header: (
      <div className="h-full w-full min-h-[250px] relative overflow-hidden rounded-xl">
        <img 
          src="https://images.unsplash.com/photo-1659437505117-d98d48e86c0f?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Blockchain Security" 
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconShield className="h-4 w-4 text-indigo-500" />,
  },
  {
    title: "Lightning Fast Performance",
    description: "Optimized for speed with instant search and rapid transaction processing.",
    header: (
      <div className="h-full w-full min-h-[120px] relative overflow-hidden rounded-xl">
        <img 
          src="https://images.unsplash.com/photo-1634024520574-fba2c8167232?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Lightning Fast Performance"
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconRocket className="h-4 w-4 text-purple-500" />,
  },
  {
    title: "Community Driven",
    description: "Join a thriving community of buyers and sellers shaping the future of commerce.",
    header: (
      <div className="h-full w-full min-h-[120px] relative overflow-hidden rounded-xl">
        <img 
          src="https://images.unsplash.com/photo-1639475377520-b256a5d204b1?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Community Driven"
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconUsers className="h-4 w-4 text-cyan-500" />,
  },
  {
    title: "Quality Assurance",
    description: "Verified product quality and seller ratings ensure you get the best value.",
    header: (
      <div className="h-full w-full min-h-[120px] relative overflow-hidden rounded-xl">
        <img 
          src="https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Quality Assurance"
          className="h-full w-full object-cover absolute inset-0"
        />
      </div>
    ),
    icon: <IconStar className="h-4 w-4 text-yellow-500" />,
  },
];
