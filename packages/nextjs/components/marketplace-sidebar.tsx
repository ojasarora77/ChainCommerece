"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconShoppingCart,
  IconBrain,
  IconChartBar,
  IconGavel,
  IconCurrencyDollar,
  IconStar,
  IconUsers,
  IconSettings,
  IconSparkles,
  IconShield,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface MarketplaceSidebarProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function MarketplaceSidebar({ 
  children, 
  activeSection = "overview",
  onSectionChange 
}: MarketplaceSidebarProps) {
  const [open, setOpen] = useState(false);

  const marketplaceLinks = [
    {
      label: "Overview",
      href: "#overview",
      icon: <IconShoppingCart className="h-5 w-5 shrink-0 text-slate-300" />,
      section: "overview"
    },
    {
      label: "Shopping Assistant",
      href: "#ai-assistant",
      icon: <IconBrain className="h-5 w-5 shrink-0 text-blue-500" />,
      section: "ai-assistant"
    },
    {
      label: "Product Recommendations",
      href: "#ai-recommendations",
      icon: <IconSparkles className="h-5 w-5 shrink-0 text-purple-500" />,
      section: "ai-recommendations"
    },
    {
      label: "Pricing Optimizer",
      href: "#pricing-optimizer",
      icon: <IconCurrencyDollar className="h-5 w-5 shrink-0 text-green-500" />,
      section: "pricing-optimizer"
    },
    {
      label: "Dispute Resolution",
      href: "#dispute-resolution",
      icon: <IconGavel className="h-5 w-5 shrink-0 text-orange-500" />,
      section: "dispute-resolution"
    },
    {
      label: "Analytics Dashboard",
      href: "#analytics",
      icon: <IconChartBar className="h-5 w-5 shrink-0 text-red-500" />,
      section: "analytics"
    },
    {
      label: "Product Reviews",
      href: "#reviews",
      icon: <IconStar className="h-5 w-5 shrink-0 text-yellow-500" />,
      section: "reviews"
    },
    {
      label: "Seller Management",
      href: "#sellers",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-cyan-500" />,
      section: "sellers"
    },
    {
      label: "Security & Trust",
      href: "#security",
      icon: <IconShield className="h-5 w-5 shrink-0 text-indigo-500" />,
      section: "security"
    },
    {
      label: "Settings",
      href: "#settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-gray-500" />,
      section: "settings"
    },
  ];

  const handleLinkClick = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="flex w-full h-full">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <MarketplaceLogo /> : <MarketplaceLogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {marketplaceLinks.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => handleLinkClick(link.section)}
                  className={cn(
                    "cursor-pointer rounded-lg transition-colors",
                    activeSection === link.section
                      ? "bg-primary/20 border-l-2 border-primary"
                      : "hover:bg-slate-800"
                  )}
                >
                  <SidebarLink link={link} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Marketplace",
                href: "#",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <IconShoppingCart className="h-4 w-4 text-white" />
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 overflow-auto bg-slate-950">
        {children}
      </div>
    </div>
  );
}

export const MarketplaceLogo = () => {
  return (
    <a
      href="/marketplace"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-lg bg-gradient-to-r from-primary to-secondary" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold whitespace-pre text-white"
      >
        Marketplace
      </motion.span>
    </a>
  );
};

export const MarketplaceLogoIcon = () => {
  return (
    <a
      href="/marketplace"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-lg bg-gradient-to-r from-primary to-secondary" />
    </a>
  );
};
