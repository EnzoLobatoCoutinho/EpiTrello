import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap, Puzzle, Layers } from "lucide-react"

export function AutomationSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container px-4">
        <div className="mb-12 space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">WORK SMARTER</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Do more with Trello
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Customize the way you integrate with easy integrations, automation, and mirroring of your to-dos across
            multiple locations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="space-y-6 border-none bg-card p-8 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Puzzle className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">Integrations</h3>
              <p className="text-muted-foreground">
                Connect the apps you use already using easy Trello workflows or add a calendar view for the tools your
                team's needs.
              </p>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              Browse integrations
            </Button>
          </Card>

          <Card className="space-y-6 border-none bg-card p-8 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">Automation</h3>
              <p className="text-muted-foreground">
                No code automation is built into every Trello board. Focus on the work that matters most and let the
                robots do the rest.
              </p>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              Get to know Automation
            </Button>
          </Card>

          <Card className="space-y-6 border-none bg-card p-8 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">Card mirroring</h3>
              <p className="text-muted-foreground">
                View all your to-dos from multiple boards in one place. Mirror a card to a board and keep track of work
                wherever you need it!
              </p>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              Compare plans
            </Button>
          </Card>
        </div>
      </div>
    </section>
  )
}
