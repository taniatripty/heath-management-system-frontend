"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavSection } from "@/types/dashboard.types";

import { userInfo } from "@/types/user.types";
import { Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardMobileSidebar from "./DashboardMobileSidebar";
import NotificationDropdown from "./NotificationDropDown";
import UserDropDown from "./UserDropDown";

interface DashboardNavbarProps {
  userInfo: userInfo;
  navItems: NavSection[];
  dashboardHome: string;
}

const DashboardNavbarContent = ({
  dashboardHome,
  navItems,
  userInfo,
}: DashboardNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSmallerScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkSmallerScreen();
    window.addEventListener("resize", checkSmallerScreen);

    return () => {
      window.removeEventListener("resize", checkSmallerScreen);
    };
  }, []);

  return (
    <div className="flex items-center gap-4 w-full px-4 py-3 border-b border-border bg-background">
      {/* Mobile Menu Toggle Button And Menu */}
      <Sheet open={isOpen && isMobile} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant={"outline"} size={"icon"} className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0">
          <DashboardMobileSidebar
            userInfo={userInfo}
            dashboardHome={dashboardHome}
            navItems={navItems}
          />
        </SheetContent>
      </Sheet>

      {/* Search Component */}
      <div className="flex-1 flex items-center">
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Search..." className="pl-9 pr-4" />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Notification */}
        <NotificationDropdown />

        {/* User Dropdown  */}
        <UserDropDown userInfo={userInfo} />
      </div>
    </div>
  );
};

export default DashboardNavbarContent;
