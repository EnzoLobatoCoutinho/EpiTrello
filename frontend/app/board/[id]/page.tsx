import { redirect } from "next/navigation"

export default function BoardRedirect({ params }: { params: { id: string } }) {
  redirect(`/dashboard/board/${params.id}`)
}
