export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
        <h1 className="text-2xl font-semibold mb-4">Photo Board</h1>
        <p className="text-gray-300 mb-6">
          Choose a page:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 text-center"
            href="/upload"
          >
            Go to Upload Page
          </a>
          <a
            className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 transition px-4 py-3 text-center"
            href="/main"
          >
            Go to Main Display
          </a>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Share <code className="text-gray-300">/upload</code> with users to submit images.
          Keep <code className="text-gray-300">/main</code> open on your screen.
        </p>
      </div>
    </main>
  );
}
