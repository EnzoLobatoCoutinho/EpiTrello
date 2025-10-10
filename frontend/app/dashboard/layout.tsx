import type React from "react"
import { Button } from "@/components/ui/button"
import { Settings, LayoutDashboard, LogOut } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="9" rx="1" fill="white" />
              <rect x="14" y="3" width="7" height="5" rx="1" fill="white" />
              <rect x="3" y="16" width="7" height="5" rx="1" fill="white" />
              <rect x="14" y="12" width="7" height="9" rx="1" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold text-foreground">Trello</span>
        </div>

        <nav className="space-y-1 p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </a>
          <a
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </a>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" asChild>
            <a href="/">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </a>
          </Button>
        </div>
      </aside>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  )
}
