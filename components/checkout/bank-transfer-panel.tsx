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
    <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-200 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-gray-900 break-all ${monospace ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 hover:border-black transition-colors"
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
    <div className="mt-8 text-left border border-gray-200 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">{t('bankTransferTitle')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('bankTransferInstructions')}</p>
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
