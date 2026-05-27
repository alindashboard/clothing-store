import type { Product } from '@/lib/types'
import { ProductCard } from './product-card'

interface ProductGridProps {
  products: Product[]
  title?: string
  subtitle?: string
  columns?: 2 | 3 | 4
}

export function ProductGrid({ products, title, subtitle, columns = 4 }: ProductGridProps) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns]

  if (products.length === 0) {
    return (
      <div>
        {title && <h2 className="text-2xl font-semibold mb-2">{title}</h2>}
        <div className="py-20 text-center text-gray-400">No products found.</div>
      </div>
    )
  }

  return (
    <div>
      {title && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
        </div>
      )}
      <div className={`grid ${colClass} gap-x-4 gap-y-10`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
