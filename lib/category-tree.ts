import type { Category } from '@/lib/types'

export interface CategoryNode extends Category {
  children: Category[]
}

/**
 * Nest a flat category list into parents with their children.
 *
 * The catalog has ~30 categories across three gender parents, so navigation
 * has to show the parents and reveal children on demand — a flat list of all
 * of them overflows the header. Orphans (a child whose parent is inactive and
 * therefore missing from the list) are promoted to top level so they stay
 * reachable rather than disappearing.
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const roots: CategoryNode[] = []
  const nodes = new Map<string, CategoryNode>()

  for (const cat of categories) {
    if (!cat.parent_id || !byId.has(cat.parent_id)) {
      const node: CategoryNode = { ...cat, children: [] }
      nodes.set(cat.id, node)
      roots.push(node)
    }
  }

  for (const cat of categories) {
    if (!cat.parent_id) continue
    nodes.get(cat.parent_id)?.children.push(cat)
  }

  return roots
}
