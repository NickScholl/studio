
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  Trophy,
  User,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export function AppSidebar() {
  const pathname = usePathname()
  const avatar = PlaceHolderImages.find(img => img.id === 'user-avatar')?.imageUrl

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Submit Match", icon: PlusCircle, path: "/matches/new" },
    { name: "Match History", icon: History, path: "/history" },
    { name: "Leaderboard", icon: Trophy, path: "/leaderboard" },
  ]

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
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar} />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">John Smash</span>
                <span className="text-xs text-muted-foreground">Pro Player</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
