
'use client';

import * as React from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Trophy,
  LogOut,
  LogIn,
  Settings
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  useUser, 
  useAuth 
} from "@/firebase";
import { signOut } from "firebase/auth";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Submit Match", icon: PlusCircle, path: "/matches/new" },
    { name: "Match History", icon: History, path: "/history" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Trophy className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="font-headline font-bold text-xl group-data-[collapsible=icon]:hidden">ShuttleScore</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.path}
                tooltip={item.name}
              >
                <Link href={item.path}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <SidebarMenu>
          {user ? (
            <>
              <SidebarMenuItem>
                <Link href="/settings" className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center hover:bg-muted rounded-md transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {user.displayName || 'Player'}
                    </span>
                    <span className="text-xs text-muted-foreground">Pro Account</span>
                  </div>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sign In">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
