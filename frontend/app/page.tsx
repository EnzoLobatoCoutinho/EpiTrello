import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary/30 to-background">
      <div className="container flex flex-col items-center gap-8 px-4 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-primary">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="9" rx="1" fill="white" />
              <rect x="14" y="3" width="7" height="5" rx="1" fill="white" />
              <rect x="3" y="16" width="7" height="5" rx="1" fill="white" />
              <rect x="14" y="12" width="7" height="9" rx="1" fill="white" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Trello</h1>
        </div>

        <p className="max-w-2xl text-balance text-xl text-muted-foreground">
          Organisez vos projets et collaborez efficacement avec votre équipe
        </p>

        <Button size="lg" className="h-12 bg-primary px-8 text-primary-foreground hover:bg-primary/90" asChild>
          <a href="/login">S'identifier</a>
        </Button>
      </div>
    </main>
  );
}
