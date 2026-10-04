import { signIn } from "@/lib/auth";

export default function ConnexionPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-display text-3xl tracking-wide text-accent">
          NAMI
        </span>
        <p className="text-sm text-foreground-muted">
          Connecte-toi pour suivre tes anime et manga.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-surface-elevated px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border"
        >
          Continuer avec Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-foreground-muted">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await signIn("nodemailer", {
            email: formData.get("email"),
            redirectTo: "/",
          });
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor="email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="toi@exemple.com"
          className="rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Recevoir un lien de connexion
        </button>
      </form>
    </div>
  );
}
