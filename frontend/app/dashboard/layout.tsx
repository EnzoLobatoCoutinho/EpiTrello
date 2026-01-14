"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useClientT } from "@/lib/i18n-client";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useClientT("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
              <img 
                src="https://i.ibb.co/b5nSXxSx/Gemini-Generated-Image-immr80immr80immr-2.png" 
                alt="Logo" 
                className="h-9 w-9 object-contain"
              />
            <span className="text-xl font-bold text-foreground">Trello</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          <Link
            href="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>{t("menu.dashboard")}</span>
          </Link>
          <Link
            href="/settings"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>{t("menu.settings")}</span>
          </Link>
        </nav>

        <div className="flex-grow" />
        <div className="p-4">
          <div className="mb-3 flex justify-center">
            <LanguageSwitcher />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
            asChild
          >
            <Link href="/">
              <LogOut className="h-5 w-5" />
              <span>{t("logout")}</span>
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center border-b bg-card px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="ml-4 text-lg font-bold">Trello</span>
        </header>

        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
