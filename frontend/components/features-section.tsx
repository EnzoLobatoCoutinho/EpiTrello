import { Card } from "@/components/ui/card"

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container px-4">
        <div className="mb-12 space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">TRELLO 101</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Your productivity powerhouse
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Make Trello work the way your team works. With Lists, Cards, and Boards. Every to-do, idea, or
            responsibility—no matter how small—finds its place, keeping you at the top of your game.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="space-y-4 border-none bg-secondary/50 p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Inbox</h3>
              <p className="text-sm text-muted-foreground">
                When it's on your mind, it goes in your Inbox. Capture your to-dos from anywhere, anytime.
              </p>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-white shadow-sm">
              <img src="/inbox-task-list-interface.jpg" alt="Inbox feature" className="h-full w-full object-cover" />
            </div>
          </Card>

          <Card className="space-y-4 border-none bg-secondary/50 p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Boards</h3>
              <p className="text-sm text-muted-foreground">
                Your to-do list may be long, but it can be manageable! Keep tabs on everything with boards that keep you
                organized.
              </p>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-white shadow-sm">
              <img src="/colorful-kanban.png" alt="Boards feature" className="h-full w-full object-cover" />
            </div>
          </Card>

          <Card className="space-y-4 border-none bg-secondary/50 p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Planner</h3>
              <p className="text-sm text-muted-foreground">
                Drag, drop, don't stress. Swap your star calendar for your updated to-do list and start tackling what
                matters.
              </p>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-white shadow-sm">
              <img src="/calendar-planner-interface.jpg" alt="Planner feature" className="h-full w-full object-cover" />
            </div>
          </Card>
        </div>

        <div className="mt-12 flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div className="h-2 w-2 rounded-full bg-muted" />
          <div className="h-2 w-2 rounded-full bg-muted" />
        </div>
      </div>
    </section>
  )
}
