export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">TechRadar</span>{" "}
            — Hub de buscas de tecnologia
          </p>
          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Remotive
            </a>
            <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Open Library
            </a>
            <a href="https://librivox.org" target="_blank" rel="noopener noreferrer" className="hover:underline">
              LibriVox
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
