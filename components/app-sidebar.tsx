"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export type HistoryEntry = { id: string; label: string; timestamp: string };

type AppSidebarProps = {
  history: HistoryEntry[];
  loading: boolean;
  error?: string | null;
  onSwitchUser: () => void;
};

export function AppSidebar({ history, loading, error, onSwitchUser }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Conversations</p>
            <p className="text-xs text-muted-foreground">History from your account</p>
          </div>
          <Button size="sm" variant="outline" onClick={onSwitchUser}>
            Switch
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            {loading ? <p className="px-2 text-xs text-muted-foreground">Loading...</p> : null}
            {error ? <p className="px-2 text-xs text-destructive">{error}</p> : null}
            {!loading && !error && history.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">No history yet.</p>
            ) : null}
            <SidebarMenu>
              {history.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium leading-none">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
