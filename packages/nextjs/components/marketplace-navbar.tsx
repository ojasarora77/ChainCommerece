"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export default function MarketplaceNavbar() {
  const { address: connectedAddress } = useAccount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Don't show wallet connection on homepage
  const isHomepage = pathname === "/";

  const navItems = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Marketplace",
      link: "/marketplace",
    },
    {
      name: "AI Preferences",
      link: "/preferences",
    },
    {
      name: "Debug Contracts",
      link: "/debug",
    },
  ];

  return (
    <div className="relative w-full">
      <Navbar className="fixed top-0 z-50 w-full">
        {/* Desktop Navigation */}
        <NavBody className="min-w-0 max-w-none">
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0">
            {!isHomepage && (
              <>
                <div className="flex-shrink-0">
                  <RainbowKitCustomConnectButton />
                </div>
                {connectedAddress && (
                  <NavbarButton variant="gradient" className="hidden sm:flex ml-1">
                    Dashboard
                  </NavbarButton>
                )}
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors py-2"
              >
                <span className="block font-medium">{item.name}</span>
              </a>
            ))}
            {!isHomepage && (
              <div className="flex w-full flex-col gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="w-full flex justify-center">
                  <RainbowKitCustomConnectButton />
                </div>
                {connectedAddress && (
                  <NavbarButton
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="gradient"
                    className="w-full max-w-xs mx-auto"
                  >
                    Dashboard
                  </NavbarButton>
                )}
              </div>
            )}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
