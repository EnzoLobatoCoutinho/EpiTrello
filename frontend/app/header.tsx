import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="9" rx="1" fill="white" />
                <rect x="14" y="3" width="7" height="5" rx="1" fill="white" />
                <rect x="3" y="16" width="7" height="5" rx="1" fill="white" />
                <rect x="14" y="12" width="7" height="9" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Trello</span>
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary">
              Features
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary">
              Solutions
              <ChevronDown className="h-4 w-4" />
            </button>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary">
              Pricing
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-sm font-medium" asChild>
            <a href="/login">Log in</a>
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <a href="/register">Get Trello for free</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
