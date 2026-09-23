import { getTranslations } from 'next-intl/server'
import { SITE_CONFIG } from '@/lib/config'

// "Chi siamo" block on the homepage. Anchored at #chi-siamo so it can be linked to.
export async function AboutSection() {
  const t = await getTranslations('home.about')
  const accent = SITE_CONFIG.brand.darkAccent

  const pillars = [
    { title: t('pricesTitle'), body: [t('prices1'), t('prices2'), t('prices3')] },
    { title: t('arrivalsTitle'), body: [t('arrivals1')] },
    { title: t('conceptTitle'), body: [t('concept1'), t('concept2')] },
  ]

  return (
    <section id="chi-siamo" className="scroll-mt-24 border-y border-[#2B2924] bg-[#1B1917] px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: accent }}
          >
            {t('eyebrow')}
          </p>
          <h2
            className="text-2xl md:text-4xl font-black tracking-tight text-[#EDE9E1]"
            style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', lineHeight: 1.1 }}
          >
            {t('lead')}
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-[#c7c3b8] mt-6" style={{ fontFamily: 'var(--font-sans)' }}>
            {t('intro')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mt-14">
          {pillars.map((pillar, i) => (
            <div key={i} className="border-t pt-6" style={{ borderColor: `${accent}40` }}>
              <p
                className="text-xs tracking-widest mb-3"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: accent }}
              >
                0{i + 1}
              </p>
              <h3
                className="text-lg font-bold text-[#EDE9E1] mb-4"
                style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
              >
                {pillar.title}
              </h3>
              <div className="space-y-3">
                {pillar.body.map((paragraph, j) => (
                  <p key={j} className="text-sm leading-relaxed text-[#c7c3b8]" style={{ fontFamily: 'var(--font-sans)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-3 text-[#8C8577]"
            style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {SITE_CONFIG.brand.name}
          </p>
          <p
            className="text-xl md:text-3xl font-black tracking-tight"
            style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', color: accent }}
          >
            {t('tagline')}
          </p>
        </div>
      </div>
    </section>
  )
}
