import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="9" rx="1" fill="white" />
                <rect x="14" y="3" width="7" height="5" rx="1" fill="white" />
                <rect x="3" y="16" width="7" height="5" rx="1" fill="white" />
                <rect x="14" y="12" width="7" height="9" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-foreground">Trello</span>
          </a>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-semibold text-foreground">Sign up for your account</h1>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" type="text" placeholder="Enter your full name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" required />
            </div>

            <div className="text-xs text-muted-foreground">
              By signing up, you agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Sign up
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}