import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20 text-center min-h-screen">
      <div>
        <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-4">404</p>
        <h1 className="text-2xl font-light mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8">The page you are looking for does not exist.</p>
        <Link href="/" className="text-sm font-medium border border-black px-8 py-3 hover:bg-black hover:text-white transition-colors">
          Go Home
        </Link>
      </div>
    </main>
  )
}
