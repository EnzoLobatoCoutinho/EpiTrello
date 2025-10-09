import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center justify-between px-4">
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

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
          <a href="/login">S'identifier</a>
        </Button>
      </div>
    </header>
  )
}
