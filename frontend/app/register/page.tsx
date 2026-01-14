/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** page
 */
"use client";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { useClientT } from "@/lib/i18n-client";

export default function RegisterPage() {
  const { t } = useClientT("auth");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="3" width="7" height="9" rx="1" fill="white" />
                <rect x="14" y="3" width="7" height="5" rx="1" fill="white" />
                <rect x="3" y="16" width="7" height="5" rx="1" fill="white" />
                <rect x="14" y="12" width="7" height="9" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-foreground">Trello</span>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow border">
          <h1 className="mb-6 text-center text-xl font-semibold">
            {t("register.title")}
          </h1>
          <RegisterForm />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t("register.link.login") === "Log in" ? "Already have an account? " : "Déjà un compte ? "}
          <Link href="/login" className="text-blue-600 hover:underline">
            {t("register.link.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
