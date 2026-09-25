import * as React from "react";

export type MobileTabId = "search" | "help" | "ai" | "tasks" | "gis" | "menu" | string;

export interface FloatingDockItem {
  id: MobileTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  variant?: "default" | "primary" | "accent";
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
}

export interface MobileTabHeaderItem {
  id: MobileTabId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  variant?: "default" | "primary" | "accent";
}

export interface MobileFloatingDockProps {
  items: FloatingDockItem[];
  className?: string;
  containerClassName?: string;
}

export interface MobileNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: MobileTabId;
  onTabChange?: (tab: MobileTabId) => void;
  tabs?: MobileTabHeaderItem[];
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  className?: string;
}
