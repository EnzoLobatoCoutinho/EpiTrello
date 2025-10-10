import { Card } from "@/components/ui/card"
import { Mail } from "react-feather" // Assuming Mail is a component from react-feather

export function IntegrationSection() {
  return (
    <section className="bg-primary py-20 text-primary-foreground md:py-32">
      <div className="container px-4">
        <div className="mb-12 space-y-4 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            From message to action
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-primary-foreground/90">
            Quickly turn communication from your favorite apps into to-dos, keeping all your discussions and tasks
            organized in one place.
          </p>
        </div>

        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="overflow-hidden border-none bg-white p-8 shadow-xl">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  <Mail className="h-4 w-4" />
                  EMAIL MAGIC
                </div>
                <h3 className="text-2xl font-bold text-foreground">Easily turn your emails into to-dos</h3>
                <p className="text-muted-foreground">
                  Forward them to your Trello inbox, and they'll be transformed by Atlassian Intelligence (AI) into
                  organized to-dos with all the links you need.
                </p>
              </div>
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <img src="/email-to-task-conversion-interface.jpg" alt="Email integration" className="h-full w-full object-cover" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-none bg-white p-8 shadow-xl">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="order-2 space-y-4 md:order-1">
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <img
                    src="/slack-and-teams-integration-with-trello.jpg"
                    alt="Messaging integration"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="order-1 space-y-4 md:order-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  MESSAGE APP SORCERY
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Need to follow up on a message from Slack or Microsoft Teams?
                </h3>
                <p className="text-muted-foreground">
                  Send it directly to your Trello board! Your favorite apps interface lets you save messages that appear
                  in your Trello inbox with AI-generated summaries and links.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
