import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function TestimonialSection() {
  return (
    <section className="bg-primary py-20 text-primary-foreground md:py-32">
      <div className="container px-4">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Card className="space-y-6 border-none bg-white p-8 text-foreground shadow-xl lg:p-12">
            <p className="text-lg leading-relaxed">
              "[Trello is] great for simplifying complex processes. As a manager, I can chunk [processes] down into
              bite-sized pieces for my team and then delegate that out, but still keep a bird's-eye view."
            </p>
            <div className="space-y-1">
              <p className="font-bold">Joey Rosenberg</p>
              <p className="text-sm text-muted-foreground">Global Leadership Director at Women Who Code</p>
            </div>
          </Card>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary-foreground/20 px-4 py-2">
                <p className="text-5xl font-bold">75% of</p>
              </div>
              <h3 className="text-3xl font-bold leading-tight md:text-4xl">
                organizations report that Trello delivers value to their business within 30 days.
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
                <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
