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
  useAuth,
  useFirestore,
  useDoc,
  useMemoFirebase,
} from "@/firebase";
import { useSidebar } from "@/components/ui/sidebar";
import { signOut } from "firebase/auth";
import { doc } from 'firebase/firestore';

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
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { setOpenMobile, isMobile } = useSidebar();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'userProfiles', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(profileRef);

  const handleSignOut = async () => {
    if (isMobile) setOpenMobile(false);
    await signOut(auth);
    router.push('/login');
  };

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Submit Match", icon: PlusCircle, path: "/matches/new" },
    { name: "Match History", icon: History, path: "/history" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const displayName = profile?.username || (profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : user?.displayName || 'Player');
  const photoURL = profile?.photoURL || user?.photoURL || undefined;

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-white border-r">
      <SidebarHeader className="p-4 bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Trophy className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="font-bold text-xl group-data-[collapsible=icon]:hidden text-sidebar-foreground">ShuttleScore</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 bg-sidebar">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.path}
                tooltip={item.name}
                onClick={handleLinkClick}
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
      <SidebarSeparator className="bg-sidebar-border" />
      <SidebarFooter className="p-4 bg-sidebar">
        <SidebarMenu>
          {user ? (
            <>
              <SidebarMenuItem>
                <Link 
                  href="/settings" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent rounded-md transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={photoURL} className="object-cover" />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate max-w-[120px] text-sidebar-foreground">
                      {displayName}
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
              <SidebarMenuButton asChild tooltip="Sign In" onClick={handleLinkClick}>
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
