import { Link } from '@/i18n/navigation'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-light tracking-wider mb-4">404</h1>
      <p className="text-gray-400 mb-8">Page not found.</p>
      <Link href="/" className="text-sm font-medium underline underline-offset-4 hover:text-gray-600">
        Back to home
      </Link>
    </div>
  )
}
