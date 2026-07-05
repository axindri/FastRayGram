import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { GitHubIcon } from "@/components/icons/GitHubIcon";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { fetchConfig } from "@/api";
import { useAuth } from "@/auth";
import { APP_VERSION } from "@/constants";
import { NAV_SECTION_LABELS, groupNavItems, type NavChildItem, type NavItem, NAV_ITEMS } from "@/config/navigation";
import { isAdminRole } from "@/types";

function closeMobileSidebar(isMobile: boolean, setOpenMobile: (open: boolean) => void) {
  if (isMobile) {
    setOpenMobile(false);
  }
}

function MobileSidebarClose() {
  const { isMobile, setOpenMobile } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0"
      aria-label="Закрыть меню"
      onClick={() => setOpenMobile(false)}
    >
      <ChevronLeft className="size-5" />
    </Button>
  );
}

function NavLeafLink({ path, label, Icon, isActive }: { path: string; label: string; Icon: NavItem["Icon"]; isActive: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link to={path} onClick={() => closeMobileSidebar(isMobile, setOpenMobile)}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupWithChildren({ item, pathname }: { item: NavItem; pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const children = item.children ?? [];
  const isGroupActive = children.some((child) => pathname.startsWith(child.path));
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (isGroupActive) {
      setOpen(true);
    }
  }, [isGroupActive, pathname]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label}>
            <item.Icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child: NavChildItem) => (
              <SidebarMenuSubItem key={child.path}>
                <SidebarMenuSubButton asChild isActive={pathname.startsWith(child.path)}>
                  <Link to={child.path} onClick={() => closeMobileSidebar(isMobile, setOpenMobile)}>
                    {child.label}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const [boostyUrl, setBoostyUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  useEffect(() => {
    void fetchConfig().then((config) => {
      setBoostyUrl(config.boosty_url);
      setGithubUrl(config.github_url);
    });
  }, []);

  const groups = useMemo(() => {
    const showAdmin = user ? isAdminRole(user.role) : false;
    const items = NAV_ITEMS.filter((item) => !item.adminOnly || showAdmin);
    return groupNavItems(items);
  }, [user]);

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center gap-1">
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/profile" onClick={() => closeMobileSidebar(isMobile, setOpenMobile)}>
                  <img src="/frg_light_on_dark.png" alt="" aria-hidden className="size-8 rounded-md" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Fast Ray Gram</span>
                    <span className="truncate text-xs text-muted-foreground">Панель управления</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <MobileSidebarClose />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.section}>
            <SidebarGroupLabel>{NAV_SECTION_LABELS[group.section]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  item.children?.length ? (
                    <NavGroupWithChildren key={item.path} item={item} pathname={location.pathname} />
                  ) : (
                    <NavLeafLink key={item.path} path={item.path} label={item.label} Icon={item.Icon} isActive={location.pathname.startsWith(item.path)} />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{APP_VERSION}</span>
          <div className="flex gap-0.5">
            {boostyUrl ? (
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={boostyUrl} target="_blank" rel="noopener noreferrer" aria-label="Поддержать на Boosty">
                  <Heart className="text-destructive" />
                </a>
              </Button>
            ) : null}
            {githubUrl ? (
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Исходный код на GitHub">
                  <GitHubIcon />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
