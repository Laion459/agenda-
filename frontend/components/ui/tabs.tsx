'use client';

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={clsx(
      "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-sm text-slate-600 dark:text-slate-400",
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={clsx(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
      "dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white",
      "hover:bg-slate-200/50 dark:hover:bg-slate-700/50",
      className
    )}
    {...props}
  />
);

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


