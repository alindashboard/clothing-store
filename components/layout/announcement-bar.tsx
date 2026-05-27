import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'

export function AnnouncementBar() {
  const threshold = SITE_CONFIG.shipping.freeShippingThreshold
  return (
    <div className="bg-black text-white text-center py-2 px-4">
      <p className="text-xs tracking-widest uppercase">
        Free shipping on orders over {formatPrice(threshold)}
      </p>
    </div>
  )
}
