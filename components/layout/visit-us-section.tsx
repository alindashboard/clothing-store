import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { STORE_INFO } from '@/lib/store-info'

export function VisitUsSection() {
  return (
    <section className="bg-stone-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Text + butoane */}
          <div>
            <p
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ fontFamily: 'var(--font-sans)', color: '#c2a04a' }}
            >
              Magazin fizic
            </p>
            <h2
              className="text-3xl md:text-4xl font-light tracking-tight mb-8 text-[#111]"
              style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
            >
              Te așteptăm în magazin
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <span>{STORE_INFO.address}</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="space-y-1">
                  <p>
                    <span className="font-medium text-gray-800">Luni–Vineri:</span>{' '}
                    {STORE_INFO.schedule.weekdays}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Sâmbătă:</span>{' '}
                    {STORE_INFO.schedule.saturday}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Duminică:</span>{' '}
                    {STORE_INFO.schedule.sunday}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Obține direcții →
              </a>
              <Link
                href="/magazin"
                className="inline-flex items-center justify-center px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium border border-black text-black hover:bg-black hover:text-white transition-colors"
              >
                Vezi detalii magazin
              </Link>
            </div>
          </div>

          {/* Decorativ */}
          <div className="hidden md:flex items-center justify-center">
            <div className="text-center select-none" aria-hidden="true">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p
                className="text-xs tracking-[0.4em] uppercase text-gray-400 font-light"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Cluj-Napoca
              </p>
              <p className="text-xs text-gray-300 mt-1 tracking-wider">România</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
