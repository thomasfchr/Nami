export default function VerificationPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="font-display text-2xl tracking-wide text-accent">
        Vérifie ta boîte mail
      </span>
      <p className="text-sm text-foreground-muted">
        Un lien de connexion vient de t&apos;être envoyé. Ouvre-le pour accéder
        à ton compte Nami.
      </p>
    </div>
  );
}
