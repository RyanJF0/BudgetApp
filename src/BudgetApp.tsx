import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialCategories = [
  { id: 'groceries', name: 'Groceries', budget: 550, color: '#3b82f6' },
  { id: 'takeout', name: 'Take out', budget: 130, color: '#10b981' },
  { id: 'entertainment', name: 'Entertainment', budget: 50, color: '#f59e0b' },
]

const categoryColors = [
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

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 2,
})

type Expense = {
  id: string
  categoryId: string
  amount: number
  description?: string
}

function formatMoney(value: number) {
  return currency.format(value || 0)
}

export default function BudgetApp() {
  const [categories, setCategories] = useState(initialCategories)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(initialCategories[0].id)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDetailCategoryId, setExpenseDetailCategoryId] = useState<string | null>(
    null
  )

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0)

  const spentByCategory = useMemo(() => {
    return categories.map((category) => {
      const spent = expenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0)

      return {
        ...category,
        spent,
      }
    })
  }, [expenses, categories])

  const totalSpent = spentByCategory.reduce((sum, item) => sum + item.spent, 0)
  const remaining = totalBudget - totalSpent

  const chartData = (() => {
    const data = spentByCategory
      .filter((item) => item.spent > 0)
      .map((item) => ({
        name: item.name,
        value: item.spent,
        color: item.color,
      }))

    if (remaining > 0) {
      data.push({
        name: 'Remaining',
        value: remaining,
        color: '#e2e8f0',
      })
    }

    return data.length ? data : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]
  })()

  const visibleCategories = categories.map((category) => {
    const matched = spentByCategory.find((item) => item.id === category.id)
    return {
      ...category,
      spent: matched?.spent ?? 0,
    }
  })

  const expenseDetailCategory = expenseDetailCategoryId
    ? visibleCategories.find((c) => c.id === expenseDetailCategoryId)
    : undefined

  const categoryExpenses = useMemo(() => {
    if (!expenseDetailCategoryId) return []
    return expenses
      .filter((e) => e.categoryId === expenseDetailCategoryId)
      .slice()
      .reverse()
  }, [expenses, expenseDetailCategoryId])

  function addExpense(e: FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!categoryId || !Number.isFinite(parsed) || parsed <= 0) return

    setExpenses((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        categoryId,
        amount: parsed,
        description: description.trim(),
      },
    ])

    setAmount('')
    setCategoryId(categories[0]?.id ?? '')
    setDescription('')
    setOpen(false)
  }

  function updateCategory(id: string, field: 'name' | 'budget', value: string) {
    setCategories((current) =>
      current.map((category) => {
        if (category.id !== id) return category
        if (field === 'budget') {
          const parsed = Number(value)
          return { ...category, budget: Number.isFinite(parsed) ? parsed : 0 }
        }
        return { ...category, name: value }
      })
    )
  }

  function addCategory() {
    const id = crypto.randomUUID()
    const usedColors = new Set(categories.map((category) => category.color))
    const nextColor =
      categoryColors.find((color) => !usedColors.has(color)) ??
      categoryColors[categories.length % categoryColors.length]

    setCategories((current) => [
      ...current,
      {
        id,
        name: 'New category',
        budget: 0,
        color: nextColor,
      },
    ])
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <Card className="rounded-[2rem] border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger
                    render={<button type="button" className="text-left" />}
                  >
                    <h1 className="text-lg font-semibold transition-opacity hover:opacity-70">
                      Budget
                    </h1>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit categories</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                      {categories.map((category) => (
                        <div key={category.id} className="grid grid-cols-[1fr_110px] gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${category.id}`}>Name</Label>
                            <Input
                              id={`name-${category.id}`}
                              type="text"
                              value={category.name}
                              onChange={(e) =>
                                updateCategory(category.id, 'name', e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`budget-${category.id}`}>Goal</Label>
                            <Input
                              id={`budget-${category.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={category.budget}
                              onChange={(e) =>
                                updateCategory(category.id, 'budget', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={addCategory}
                      >
                        Add category
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-slate-500">{formatMoney(totalSpent)} spent</p>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button size="icon" className="h-11 w-11 rounded-full shadow-sm" />}>
                  <Plus className="h-5 w-5" />
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add expense</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={addExpense} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        type="text"
                        placeholder="Optional"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full rounded-xl">
                      Add
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="relative mx-auto h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={102}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-3xl leading-none font-semibold">
                  {formatMoney(remaining)}
                </div>
                <div className="mt-1 text-xs text-slate-500">remaining</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {visibleCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExpenseDetailCategoryId(item.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatMoney(item.spent)}
                  </span>
                </button>
              ))}
            </div>

            <Dialog
              open={expenseDetailCategoryId !== null}
              onOpenChange={(isOpen) => {
                if (!isOpen) setExpenseDetailCategoryId(null)
              }}
            >
              <DialogContent className="rounded-2xl sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>{expenseDetailCategory?.name ?? 'Expenses'}</DialogTitle>
                  {expenseDetailCategory ? (
                    <DialogDescription>
                      {formatMoney(expenseDetailCategory.spent)} spent in this category
                    </DialogDescription>
                  ) : null}
                </DialogHeader>
                <div className="max-h-64 space-y-2 overflow-y-auto pt-2">
                  {categoryExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No expenses yet</p>
                  ) : (
                    categoryExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2"
                      >
                        <span className="text-sm font-medium text-slate-900">
                          {formatMoney(expense.amount)}
                        </span>
                        {expense.description ? (
                          <span className="text-muted-foreground text-xs">
                            {expense.description}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            No description
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
