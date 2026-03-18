"use client";

import * as React from "react";
import {
  Database,
  Table,
  Shield,
  Zap,
  Terminal,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { use } from "react";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { projectId } = use(params);

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto py-10 px-8 space-y-12">
        {/* Project Header Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-foreground uppercase tracking-tight">
                {projectId}
              </h1>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold tracking-tighter align-middle">
                NANO
              </span>
            </div>
            <div className="flex items-center gap-8 text-muted-foreground">
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-foreground">
                  0
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  Tables
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-foreground">
                  0
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  Functions
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-foreground">
                  0
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  Replicas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
              Project Status: Active
            </span>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome to your new project
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your project has been deployed on its own instance, with its own API
            all set up and ready to use. Start building your application by
            creating tables and inserting data.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Build out your database
              </h3>
              <p className="text-muted-foreground/80 text-sm">
                Our Table Editor makes Postgres as easy to use as a spreadsheet,
                but there&apos;s also our SQL Editor if you need something more.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-muted border-border text-xs gap-2 hover:bg-accent hover:text-foreground"
              >
                <Table className="h-3.5 w-3.5" />
                Table Editor
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-muted border-border text-xs gap-2 hover:bg-accent hover:text-foreground"
              >
                <Terminal className="h-3.5 w-3.5" />
                SQL Editor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-xs gap-2"
              >
                <BookOpen className="h-3.5 w-3.5" />
                About Database
              </Button>
            </div>
          </div>

          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center group overflow-hidden">
            <div className="absolute inset-0 opacity-20 filter blur-2xl group-hover:opacity-30 transition-opacity">
              <div className="absolute top-1/4 left-1/4 h-24 w-24 rounded-full bg-emerald-500/30" />
              <div className="absolute bottom-1/4 right-1/4 h-32 w-32 rounded-full bg-emerald-500/20" />
            </div>
            <div className="flex flex-col items-center gap-4 z-10">
              <Database className="h-12 w-12 text-emerald-500/50" />
              <span className="text-zinc-500 text-xs font-medium">
                Interactive Database Explorer
              </span>
            </div>
          </div>
        </div>

        {/* Explore Products */}
        <div className="space-y-8 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Explore our other products
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Authentication",
                icon: Shield,
                desc: "Manage users and auth providers.",
              },
              {
                title: "Storage",
                icon: Database,
                desc: "Store and serve any file types.",
              },
              {
                title: "Edge Functions",
                icon: Zap,
                desc: "Write custom code without deploying.",
              },
              {
                title: "Realtime",
                icon: Zap,
                desc: "Listen to your Database in realtime.",
              },
            ].map((product, i) => (
              <div
                key={i}
                className="group p-5 rounded-xl border border-border bg-muted/40 hover:bg-accent/60 hover:border-border transition-all cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                  <product.icon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  {product.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {product.desc}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest group-hover:text-foreground transition-colors">
                  Explore <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
