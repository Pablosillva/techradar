export function Footer() {
  return (
    <footer className="border-t border-white/[0.05]">
      <div className="flex flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <p>
          <span className="font-semibold text-slate-300">DevPath Hub</span> — Do mecânico ao Full
          Stack.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://remotive.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-300"
          >
            Remotive
          </a>
          <a
            href="https://openlibrary.org"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-300"
          >
            Open Library
          </a>
          <a
            href="https://librivox.org"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-300"
          >
            LibriVox
          </a>
        </div>
      </div>
    </footer>
  );
}
