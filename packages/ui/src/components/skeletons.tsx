"use client";

import * as React from "react";
import { cn } from "../utils";
import { Skeleton } from "./skeleton";

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 pb-4", className)}>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6 w-full max-w-[95rem] mx-auto animate-pulse">
      {/* Page Header */}
      <PageHeaderSkeleton />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/60 p-6 h-36">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4 rounded-md" />
            </div>
            <Skeleton className="h-8 w-16 mt-2" />
            <div className="flex justify-between items-center mt-auto">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* DevOps & Deployment Status */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/60 p-6 h-56">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
              <div className="flex flex-col gap-2 mt-auto">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[95rem] mx-auto animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <PageHeaderSkeleton />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Filter / Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between py-2 border-b border-border/40">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Data Table Skeleton */}
      <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center px-6 py-3 border-b border-border bg-muted/60">
          <Skeleton className="h-3 w-8 mr-6" />
          <Skeleton className="h-3 w-40 mr-auto" />
          <Skeleton className="h-3 w-24 mr-20" />
          <Skeleton className="h-3 w-32 mr-20" />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Table Rows */}
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center px-6 py-4 border-b border-border last:border-0">
              <Skeleton className="h-4 w-6 mr-6" />
              <div className="flex flex-col gap-1.5 mr-auto">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-24 mr-20" />
              <Skeleton className="h-4 w-32 mr-20" />
              <Skeleton className="h-5 w-16 rounded-full mr-4" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[95rem] mx-auto animate-pulse">
      {/* Page Header */}
      <PageHeaderSkeleton />

      {/* Form Container */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-6 flex flex-col gap-6 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-3 w-64" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[95rem] mx-auto animate-pulse">
      {/* Page Header */}
      <PageHeaderSkeleton />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/60 p-6 h-48">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
            </div>
            <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/40">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
