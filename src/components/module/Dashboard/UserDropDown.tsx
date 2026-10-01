"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userInfo } from "@/types/user.types";
import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserDropDownProps {
  userInfo: userInfo;
}

export default function UserDropDown({ userInfo }: UserDropDownProps) {
  const router = useRouter();
  const initials = userInfo?.name?.trim()?.charAt(0)?.toUpperCase() ?? "U";
  const roleLabel = userInfo?.role?.toLowerCase().replace("_", " ") ?? "user";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full px-2 py-1.5 h-auto"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="hidden sm:flex flex-col items-start leading-none text-left">
            <span className="text-sm font-medium">{userInfo.name}</span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {roleLabel}
            </span>
          </div>

          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <p className="truncate font-medium">{userInfo.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {userInfo.email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          onClick={() => router.push("/myProfile")}
        >
          <UserCircle className="h-4 w-4" />
          My Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          onClick={() => router.push("/changePassword")}
        >
          <Settings className="h-4 w-4" />
          Change Password
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
          onClick={() => router.push("/login")}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
