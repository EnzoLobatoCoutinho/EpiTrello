import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { CreateBoardDialog } from "@/components/dashboard/create-board-dialog";
import { getServerT } from "@/lib/i18n-server";

interface Board {
  id: number;
  title: string;
  _count: {
    lists: number;
  };
}

async function getUser() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    return jwt.decode(token) as { userId: number; email: string };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "fr";
  const t = await getServerT(locale, "common");

  const boards = await prisma.board.findMany({
    where: {
      workspace: { owner_id: user.userId },
    },
    orderBy: { id: "desc" },
    include: {
      _count: { select: { lists: true } },
    },
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("dashboard.welcome", { email: user.email })}
          </p>
        </div>
        <CreateBoardDialog triggerStyle="button" />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground md:text-xl">
          {t("dashboard.myBoards")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board: Board) => (
            <Link key={board.id} href={`/dashboard/board/${board.id}`}>
              <Card className="group h-full cursor-pointer overflow-hidden bg-white transition-all hover:shadow-lg">
                <div className="h-24 bg-blue-500 transition-opacity group-hover:opacity-90" />
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-foreground">
                    {board.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.listsCount", {
                      count: board._count.lists,
                    })}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
          <CreateBoardDialog triggerStyle="card" />
        </div>
      </div>
    </div>
  );
}