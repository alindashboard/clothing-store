'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'

interface BankTransferPanelProps {
  orderNumber: string
  total: number
  currency: string
}

function CopyField({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
  const t = useTranslations('checkout')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — field remains manually selectable
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[#2B2924] last:border-b-0">
      <div className="min-w-0">
        <p className="text-[11px] text-[#8C8577] uppercase tracking-[0.18em]">{label}</p>
        <p className={`text-sm text-[#EDE9E1] break-all ${monospace ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#3a3833] text-[#c7c3b8] hover:border-[#D9B679] hover:text-[#EDE9E1] transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  )
}

export function BankTransferPanel({ orderNumber, total, currency }: BankTransferPanelProps) {
  const t = useTranslations('checkout')
  const { bankName, accountHolder, iban, bic } = SITE_CONFIG.checkout.bankTransfer

  return (
    <div className="mt-10 text-left border border-[#2B2924] bg-[#1A1917] p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EDE9E1] mb-2" style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}>{t('bankTransferTitle')}</h2>
      <p className="text-xs text-[#8C8577] mb-4">{t('bankTransferInstructions')}</p>
      <div>
        <CopyField label={t('amountDue')} value={formatPrice(total, currency)} />
        <CopyField label={t('paymentReference')} value={orderNumber} monospace />
        <CopyField label={t('bankName')} value={bankName} />
        <CopyField label={t('accountHolder')} value={accountHolder} />
        <CopyField label={t('iban')} value={iban} monospace />
        <CopyField label={t('bic')} value={bic} monospace />
      </div>
    </div>
  )
}
