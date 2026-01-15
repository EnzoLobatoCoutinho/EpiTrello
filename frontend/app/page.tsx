import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Users,
  Zap,
  BarChart3,
  Layout,
  Calendar,
} from "lucide-react";
import { cookies } from "next/headers";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getServerT } from "@/lib/i18n-server";

export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "fr";
  const tHeader = await getServerT(locale, "header");
  const tLanding = await getServerT(locale, "landing");
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Ollert Logo" className="h-10 w-10" />
            <span className="text-xl font-bold">Ollert</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <Button variant="outline" asChild>
              <a href="/login">{tHeader("cta.login")}</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            La plateforme complète pour organiser vos projets.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
            Votre boîte à outils pour arrêter de configurer et commencer à
            innover. Construisez, déployez et gérez vos projets en toute
            sécurité.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8" asChild>
              <a href="/register">{tLanding("cta.signup")}</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 bg-transparent"
              asChild
            >
              <a href="/login">{tLanding("cta.login")}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold md:text-5xl">
            Tout ce dont vous avez besoin pour réussir
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Des outils puissants pour votre équipe et vos parties prenantes afin
            de partager des retours et d'itérer plus rapidement.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Layout className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Tableaux visuels</h3>
            <p className="text-sm text-muted-foreground">
              Organisez vos tâches avec des tableaux Kanban intuitifs.
              Glissez-déposez vos cartes pour une gestion fluide.
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Collaboration en temps réel
            </h3>
            <p className="text-sm text-muted-foreground">
              Travaillez ensemble sans friction. Commentaires, mentions et
              notifications pour garder tout le monde synchronisé.
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Automatisations</h3>
            <p className="text-sm text-muted-foreground">
              Automatisez les tâches répétitives avec des règles personnalisées.
              Gagnez du temps et concentrez-vous sur l'essentiel.
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Calendrier intégré</h3>
            <p className="text-sm text-muted-foreground">
              Visualisez vos échéances et planifiez votre travail avec une vue
              calendrier complète et synchronisée.
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Rapports détaillés</h3>
            <p className="text-sm text-muted-foreground">
              Suivez la progression de vos projets avec des tableaux de bord et
              des métriques en temps réel.
            </p>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <CheckCircle2 className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Gestion des tâches</h3>
            <p className="text-sm text-muted-foreground">
              Créez des checklists, assignez des responsables et suivez
              l'avancement de chaque tâche facilement.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-bold md:text-5xl">
              Itération rapide. Plus d'innovation.
            </h2>
            <p className="mt-4 text-balance text-lg text-muted-foreground">
              La plateforme pour des progrès rapides. Laissez votre équipe se
              concentrer sur la livraison de fonctionnalités au lieu de gérer
              l'infrastructure.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8" asChild>
                <a href="/register">{tLanding("cta.signup")}</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 bg-transparent"
                asChild
              >
                <a href="/login">{tLanding("cta.login")}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          2025 Trello. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}
