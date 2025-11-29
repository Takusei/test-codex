"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext<{
  expanded: boolean;
  toggle: () => void;
} | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = React.useState(true);
  const toggle = React.useCallback(() => setExpanded((state) => !state), []);

  const value = React.useMemo(() => ({ expanded, toggle }), [expanded, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within a SidebarProvider");
  }
  return context;
}

export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { expanded } = useSidebar();

    return (
      <div
        ref={ref}
        data-expanded={expanded}
        className={cn(
          "group/sidebar relative flex h-screen min-h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-200",
          expanded ? "w-72" : "w-16",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 space-y-2 overflow-y-auto px-3 py-2", className)} {...props} />
  )
);
SidebarContent.displayName = "SidebarContent";

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b px-4 pb-4 pt-6", className)} {...props} />
  )
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-t px-4 py-4", className)} {...props} />
  )
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("space-y-1", className)} {...props} />
);
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
      {...props}
    />
  )
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-md bg-muted/50 p-2", className)} {...props} />
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("space-y-1", className)} {...props} />
  )
);
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("list-none", className)} {...props} />
);
SidebarMenuItem.displayName = "SidebarMenuItem";

type SidebarMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  isActive?: boolean;
};

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, children, asChild = false, isActive = false, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(
          "block w-full rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          className,
          (children as React.ReactElement).props.className
        ),
      });
    }

    return (
      <button
        ref={ref}
        className={cn(
          "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex min-h-screen flex-1 flex-col", className)} {...props} />
  )
);
SidebarInset.displayName = "SidebarInset";

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { toggle } = useSidebar();

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        <span className="sr-only">Toggle sidebar</span>
        <svg
          aria-hidden
          focusable="false"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6h12" />
          <path d="M4 10h12" />
          <path d="M4 14h12" />
        </svg>
      </button>
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarRail = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-y-0 right-0 w-1 rounded-l-full bg-gradient-to-b from-muted/80 to-transparent",
        className
      )}
      aria-hidden
      {...props}
    />
  )
);
SidebarRail.displayName = "SidebarRail";
