'use client';

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import { ReactNode } from "react";
import { COMPONENT_TOKENS, TRANSITIONS } from "@/constants/design-tokens";

interface TabsListProps extends TabsPrimitive.TabsListProps {
  variant?: 'default' | 'pills';
}

interface TabsTriggerProps extends TabsPrimitive.TabsTriggerProps {
  icon?: ReactNode;
}

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, variant = 'default', ...props }: TabsListProps) => (
  <TabsPrimitive.List
    className={clsx(
      "inline-flex h-10 items-center justify-center rounded-md p-1 text-sm",
      variant === 'pills' 
        ? "gap-1 bg-slate-100 dark:bg-slate-800"
        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, icon, children, ...props }: TabsTriggerProps) => {
  const hasIcon = icon !== undefined;
  
  return (
    <TabsPrimitive.Trigger
      className={clsx(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
        "dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white",
        "hover:bg-slate-200/50 dark:hover:bg-slate-700/50",
        "group",
        className
      )}
      {...props}
    >
      {hasIcon && (
        <span className="mr-1.5 flex-shrink-0">
          {icon}
        </span>
      )}
      {children}
      {/* Indicador animado (underline) */}
      <span
        className={clsx(
          "absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400",
          "transform scale-x-0 transition-transform duration-200 ease-out",
          "data-[state=active]:scale-x-100",
          "group-data-[state=active]:scale-x-100"
        )}
        aria-hidden="true"
      />
    </TabsPrimitive.Trigger>
  );
};

export const TabsContent = ({ className, ...props }: TabsPrimitive.TabsContentProps) => (
  <TabsPrimitive.Content
    className={clsx(
      "mt-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      "animate-fade-in",
      className
    )}
    {...props}
  />
);


