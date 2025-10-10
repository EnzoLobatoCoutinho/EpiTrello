import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 to-background py-20 md:py-32">
      <div className="container px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Capture, organize, and tackle your to-dos from anywhere.
              </h1>
              <p className="text-pretty text-lg text-muted-foreground md:text-xl">
                Escape the clutter and chaos—unleash your productivity with Trello.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input type="email" placeholder="Email" className="h-12 max-w-sm bg-white" />
              <Button size="lg" className="h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                Sign up - it's free!
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              By entering my email, I acknowledge the{" "}
              <a href="#" className="text-primary hover:underline">
                Atlassian Privacy Policy
              </a>
            </p>

            <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Watch video
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-md">
              <img
                src="/smartphone-mockup-with-task-management-app-interfa.jpg"
                alt="Trello mobile app"
                className="relative z-10 w-full drop-shadow-2xl"
              />
              <div className="absolute -right-8 top-20 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
                <Mail className="h-6 w-6 text-red-500" />
              </div>
              <div className="absolute -right-4 top-40 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4" />
                </svg>
              </div>
              <div className="absolute -left-8 bottom-32 h-32 w-32 rounded-2xl bg-accent/80 shadow-xl" />
              <div className="absolute -right-12 bottom-20 h-40 w-40 rounded-2xl bg-[#C026D3] shadow-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
