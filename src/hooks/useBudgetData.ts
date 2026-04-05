import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

export type Category = { id: string; name: string; budget: number; color: string }
export type Expense = { id: string; categoryId: string; amount: number; description?: string }

const SEED_CATEGORIES = [
  { name: 'Groceries', budget: 550, color: '#3b82f6' },
  { name: 'Take out', budget: 130, color: '#10b981' },
  { name: 'Entertainment', budget: 50, color: '#f59e0b' },
]

const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#ec4899',
  '#14b8a6',
]

export function useBudgetData(userId: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingPatches = useRef<Map<string, { name?: string; budget?: number }>>(new Map())

  const load = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }
    setError(null)

    const { data: catRows, error: e1 } = await sb
      .from('categories')
      .select('id,name,budget,color')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (e1) {
      console.error(e1)
      setError(e1.message)
      setLoading(false)
      return
    }

    let cats: Category[] = (catRows ?? []).map((row: { id: string; name: string; budget: unknown; color: string }) => ({
      id: row.id,
      name: row.name,
      budget: Number(row.budget),
      color: row.color,
    }))

    if (cats.length === 0) {
      const { error: insErr } = await sb.from('categories').insert(
        SEED_CATEGORIES.map((c) => ({ user_id: userId, ...c }))
      )
      if (insErr) {
        console.error(insErr)
        setError(insErr.message)
        setLoading(false)
        return
      }
      const { data: again, error: e2 } = await sb
        .from('categories')
        .select('id,name,budget,color')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (e2) {
        console.error(e2)
        setError(e2.message)
        setLoading(false)
        return
      }
      cats = (again ?? []).map((row: { id: string; name: string; budget: unknown; color: string }) => ({
        id: row.id,
        name: row.name,
        budget: Number(row.budget),
        color: row.color,
      }))
    }

    const { data: expRows, error: e3 } = await sb
      .from('expenses')
      .select('id,category_id,amount,description')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (e3) {
      console.error(e3)
      setError(e3.message)
      setLoading(false)
      return
    }

    const exps: Expense[] = (expRows ?? []).map(
      (row: { id: string; category_id: string; amount: unknown; description: string | null }) => ({
        id: row.id,
        categoryId: row.category_id,
        amount: Number(row.amount),
        description: row.description ? String(row.description) : undefined,
      })
    )

    setCategories(cats)
    setExpenses(exps)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((t) => clearTimeout(t))
      debounceTimers.current.clear()
    }
  }, [])

  const flushCategoryUpdate = useCallback(
    async (id: string) => {
      const sb = getSupabase()
      const patch = pendingPatches.current.get(id)
      pendingPatches.current.delete(id)
      if (!sb || !patch || Object.keys(patch).length === 0) return
      const { error: e } = await sb
        .from('categories')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId)
      if (e) {
        console.error(e)
        setError(e.message)
        await load()
      }
    },
    [userId, load]
  )

  const flushPendingCategories = useCallback(async () => {
    const ids = new Set([...debounceTimers.current.keys(), ...pendingPatches.current.keys()])
    for (const id of ids) {
      const t = debounceTimers.current.get(id)
      if (t) clearTimeout(t)
      debounceTimers.current.delete(id)
    }
    for (const id of ids) {
      await flushCategoryUpdate(id)
    }
  }, [flushCategoryUpdate])

  const updateCategory = useCallback(
    (id: string, field: 'name' | 'budget', value: string) => {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          if (field === 'budget') {
            const parsed = Number(value)
            return { ...c, budget: Number.isFinite(parsed) ? parsed : 0 }
          }
          return { ...c, name: value }
        })
      )

      const prevPatch = pendingPatches.current.get(id) ?? {}
      if (field === 'name') {
        prevPatch.name = value
      } else {
        const parsed = Number(value)
        prevPatch.budget = Number.isFinite(parsed) ? parsed : 0
      }
      pendingPatches.current.set(id, prevPatch)

      const existing = debounceTimers.current.get(id)
      if (existing) clearTimeout(existing)
      const t = setTimeout(() => {
        debounceTimers.current.delete(id)
        void flushCategoryUpdate(id)
      }, 450)
      debounceTimers.current.set(id, t)
    },
    [flushCategoryUpdate]
  )

  const addExpense = useCallback(
    async (categoryId: string, amount: number, description: string) => {
      const sb = getSupabase()
      if (!sb) return false
      setError(null)
      const { error: e } = await sb.from('expenses').insert({
        user_id: userId,
        category_id: categoryId,
        amount,
        description: description || null,
      })
      if (e) {
        console.error(e)
        setError(e.message)
        return false
      }
      await load()
      return true
    },
    [userId, load]
  )

  const addCategory = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    setError(null)

    const usedColors = new Set(categories.map((c) => c.color))
    const nextColor =
      CATEGORY_COLORS.find((color) => !usedColors.has(color)) ??
      CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]

    const { error: e } = await sb.from('categories').insert({
      user_id: userId,
      name: 'New category',
      budget: 0,
      color: nextColor,
    })
    if (e) {
      console.error(e)
      setError(e.message)
      return
    }
    await load()
  }, [userId, load, categories])

  return {
    categories,
    expenses,
    loading,
    error,
    refresh: load,
    updateCategory,
    addExpense,
    addCategory,
    flushPendingCategories,
  }
}
