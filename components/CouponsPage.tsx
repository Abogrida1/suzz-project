"use client"

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Coupon } from '@/lib/supabaseClient'
import { Tag, Plus, Edit, Trash2, Percent, Calendar, Users, Filter } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

type StatusFilter = 'all' | 'active' | 'upcoming' | 'expired' | 'exhausted'

export default function CouponsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'valid_to' | 'discount_percent'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const queryClient = useQueryClient()
  const addDaysLocal = (date: Date | string, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }


  const queryKey = useMemo(() => ['coupons', { searchTerm, statusFilter, sortBy, sortDir, page, pageSize }], [searchTerm, statusFilter, sortBy, sortDir, page, pageSize])

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('coupons')
        .select('*', { count: 'exact' })

      // Search by code
      if (searchTerm.trim()) {
        query = query.ilike('code', `%${searchTerm.trim()}%`)
      }

      // Status filter
      const nowIso = new Date().toISOString()
      if (statusFilter === 'active') {
        query = query.lte('valid_from', nowIso).gte('valid_to', nowIso)
      } else if (statusFilter === 'upcoming') {
        query = query.gt('valid_from', nowIso)
      } else if (statusFilter === 'expired') {
        query = query.lt('valid_to', nowIso)
      }

      // Sorting
      query = query.order(sortBy, { ascending: sortDir === 'asc' })

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, error, count } = await query.range(from, to)
      if (error) throw error
      return { rows: data as Coupon[], count: count || 0 }
    },
    keepPreviousData: true,
  })

  const coupons = data?.rows || []
  const total = data?.count || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[] | string) => {
      const idsArr = Array.isArray(ids) ? ids : [ids]
      const { error } = await supabase.from('coupons').delete().in('id', idsArr)
      if (error) throw error
    },
    onSuccess: () => {
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey })
      toast.success('تم حذف الكوبونات بنجاح')
    },
    onError: () => toast.error('فشل حذف الكوبونات'),
  })

  const generateRandomCouponMutation = useMutation({
    mutationFn: async () => {
      const discounts = [10, 15, 20, 25, 30, 35, 40]
      const randomDiscount = discounts[Math.floor(Math.random() * discounts.length)]
      const randomCode = `DEAL${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const validTo = addDaysLocal(new Date(), 7)
      const couponData = {
        code: randomCode,
        discount_percent: randomDiscount,
        max_uses: 100,
        uses_count: 0,
        valid_from: new Date().toISOString(),
        valid_to: validTo.toISOString(),
        daily_limit: Math.floor(Math.random() * 15) + 5,
      }
      const { error } = await supabase.from('coupons').insert([couponData])
      if (error) throw error
      return couponData
    },
    onSuccess: (couponData) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(`تم إنشاء كوبون ${couponData.code} بخصم ${couponData.discount_percent}%`)
    },
    onError: () => toast.error('حدث خطأ في إنشاء الكوبون')
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Coupon> & { id: string }) => {
      const { error } = await supabase.from('coupons').update(updates).eq('id', updates.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error('فشل تحديث الكوبون'),
  })

  const bulkExtend = useMutation({
    mutationFn: async ({ ids, days }: { ids: string[]; days: number }) => {
      const target = coupons.filter(c => ids.includes(c.id))
      await Promise.all(target.map(async (c) => {
        const newTo = addDaysLocal(new Date(c.valid_to), days).toISOString()
        const { error } = await supabase.from('coupons').update({ valid_to: newTo }).eq('id', c.id)
        if (error) throw error
      }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('تم تمديد الصلاحية')
    },
    onError: () => toast.error('فشل تمديد الصلاحية'),
  })

  const bulkResetUses = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('coupons').update({ uses_count: 0 }).in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('تم تصفير الاستخدامات')
    },
    onError: () => toast.error('فشل تصفير الاستخدامات'),
  })

  const duplicateCoupon = async (coupon: Coupon) => {
    const newCode = `${coupon.code}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
    const { error } = await supabase.from('coupons').insert([{
      code: newCode,
      discount_percent: coupon.discount_percent,
      max_uses: coupon.max_uses,
      uses_count: 0,
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to,
      daily_limit: coupon.daily_limit,
    }])
    if (error) throw error
    queryClient.invalidateQueries({ queryKey })
    toast.success('تم نسخ الكوبون')
  }

  const announceCoupon = async (coupon: Coupon) => {
    try {
      const message = {
        title: `كوبون خصم جديد: ${coupon.code}`,
        content: `احصل على خصم ${coupon.discount_percent}% باستخدام الكود ${coupon.code}. صالح حتى ${format(new Date(coupon.valid_to), 'dd/MM/yyyy', { locale: ar })}.`,
        message_type: 'info',
        priority: 'normal',
        is_broadcast: true,
      }
      const { error } = await supabase.from('admin_messages').insert(message as any)
      if (error) throw error
      toast.success('تم الإعلان عن الكوبون')
    } catch (e) {
      toast.error('تعذر إرسال الإعلان')
    }
  }

  const getCouponStatus = (coupon: Coupon): { status: string; color: string } => {
    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validTo = new Date(coupon.valid_to)
    if (now < validFrom) return { status: 'لم يبدأ بعد', color: 'bg-gray-100 text-gray-800' }
    if (now > validTo) return { status: 'منتهي الصلاحية', color: 'bg-red-100 text-red-800' }
    if (coupon.uses_count >= coupon.max_uses) return { status: 'مستنفد', color: 'bg-orange-100 text-orange-800' }
    return { status: 'نشط', color: 'bg-green-100 text-green-800' }
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? coupons.map(c => c.id) : [])
  }
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }

  const exportCsv = (rows: Coupon[]) => {
    if (!rows.length) return
    const safe = rows.map(r => ({
      code: r.code,
      discount_percent: r.discount_percent,
      max_uses: r.max_uses,
      uses_count: r.uses_count,
      daily_limit: r.daily_limit ?? '',
      valid_from: r.valid_from,
      valid_to: r.valid_to,
    }))
    const headers = Object.keys(safe[0])
    const csv = [headers.join(','), ...safe.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'coupons.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  if (error) {
    return <div className="text-center text-red-600">حدث خطأ في تحميل الكوبونات: {(error as any).message}</div>
  }

  const stats = {
    total: total,
    active: coupons.filter(c => {
      const now = new Date()
      return new Date(c.valid_from) <= now && new Date(c.valid_to) >= now && c.uses_count < c.max_uses
    }).length,
    expired: coupons.filter(c => new Date(c.valid_to) < new Date()).length,
    totalUses: coupons.reduce((sum, c) => sum + c.uses_count, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الكوبونات</h1>
          <p className="mt-1 text-sm text-gray-500">إنشاء وإدارة كوبونات الخصم والعروض</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => generateRandomCouponMutation.mutate()} disabled={generateRandomCouponMutation.isPending} className="btn-secondary flex items-center gap-2">
            <Percent className="h-5 w-5" /> {generateRandomCouponMutation.isPending ? 'جاري الإنشاء...' : 'كوبون عشوائي'}
          </button>
          <button onClick={() => { setEditingCoupon(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" /> إضافة كوبون جديد
          </button>
        </div>
      </div>

      {/* Filters and bulk actions */}
      <div className="bg-white rounded-xl border p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-gray-500" />
          <input value={searchTerm} onChange={(e) => { setPage(1); setSearchTerm(e.target.value) }} placeholder="بحث بالكود..." className="input-field" />
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value as StatusFilter) }} className="input-field max-w-[160px]">
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="upcoming">لم يبدأ</option>
            <option value="expired">منتهي</option>
            <option value="exhausted">مستنفد</option>
          </select>
          <button onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }} className="btn-secondary flex items-center gap-1">
            ⇅ {sortBy === 'created_at' ? 'تاريخ الإنشاء' : sortBy === 'valid_to' ? 'انتهاء الصلاحية' : 'الخصم'} ({sortDir === 'asc' ? 'تصاعدي' : 'تنازلي'})
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input-field max-w-[180px]">
            <option value="created_at">تاريخ الإنشاء</option>
            <option value="valid_to">انتهاء الصلاحية</option>
            <option value="discount_percent">نسبة الخصم</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCsv(selectedIds.length ? coupons.filter(c => selectedIds.includes(c.id)) : coupons)} className="btn-secondary flex items-center gap-2">
            ⬇️ تصدير CSV
          </button>
          <button onClick={() => selectedIds.length && bulkExtend.mutate({ ids: selectedIds, days: 7 })} disabled={!selectedIds.length} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            📅 تمديد +7 أيام
          </button>
          <button onClick={() => selectedIds.length && bulkResetUses.mutate(selectedIds)} disabled={!selectedIds.length} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            🔄 تصفير الاستخدام
          </button>
          <button onClick={() => selectedIds.length && deleteMutation.mutate(selectedIds)} disabled={!selectedIds.length} className="btn-danger flex items-center gap-2 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> حذف المحدد
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="card p-4 sm:p-6"><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-lg"><Tag className="h-6 w-6 text-blue-600" /></div><div className="mr-4"><p className="text-sm text-gray-500">إجمالي</p><p className="text-2xl font-bold">{stats.total}</p></div></div></div>
        <div className="card p-4 sm:p-6"><div className="flex items-center"><div className="p-2 bg-green-100 rounded-lg"><Tag className="h-6 w-6 text-green-600" /></div><div className="mr-4"><p className="text-sm text-gray-500">نشط</p><p className="text-2xl font-bold">{stats.active}</p></div></div></div>
        <div className="card p-4 sm:p-6"><div className="flex items-center"><div className="p-2 bg-red-100 rounded-lg"><Calendar className="h-6 w-6 text-red-600" /></div><div className="mr-4"><p className="text-sm text-gray-500">منتهي</p><p className="text-2xl font-bold">{stats.expired}</p></div></div></div>
        <div className="card p-4 sm:p-6"><div className="flex items-center"><div className="p-2 bg-purple-100 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div><div className="mr-4"><p className="text-sm text-gray-500">الاستخدامات</p><p className="text-2xl font-bold">{stats.totalUses}</p></div></div></div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="px-3 py-4 sm:px-4 sm:py-5">
          {coupons.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3"><input type="checkbox" checked={selectedIds.length === coupons.length && coupons.length > 0} onChange={(e) => toggleSelectAll(e.target.checked)} /></th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكود</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخصم</th>
                    <th className="hidden md:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاستخدامات</th>
                    <th className="hidden lg:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحد اليومي</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البداية</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الانتهاء</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon)
                    const checked = selectedIds.includes(coupon.id)
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3"><input type="checkbox" checked={checked} onChange={(e) => toggleSelect(coupon.id, e.target.checked)} /></td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 text-gray-400 ml-2" />
                            <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                            <button onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('تم نسخ الكود') }} className="ml-2 text-gray-500 hover:text-gray-700" title="نسخ الكود">📋</button>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap"><span className="font-bold text-green-600">{coupon.discount_percent}%</span></td>
                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap">
                          <div>{coupon.uses_count} / {coupon.max_uses}</div>
                          <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min((coupon.uses_count / coupon.max_uses) * 100, 100)}%` }}></div>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap">{coupon.daily_limit ?? '—'}</td>
                        <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-gray-600">{format(new Date(coupon.valid_from), 'dd/MM/yyyy', { locale: ar })}</td>
                        <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-gray-600">{format(new Date(coupon.valid_to), 'dd/MM/yyyy', { locale: ar })}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.status}</span></td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setTimeout(() => { setEditingCoupon(coupon); setShowModal(true) }, 0)} className="text-indigo-600 hover:text-indigo-900" title="تعديل"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => duplicateCoupon(coupon)} className="text-gray-600 hover:text-gray-900" title="نسخ">📋</button>
                            <button onClick={() => updateMutation.mutate({ id: coupon.id, uses_count: 0 })} className="text-amber-600 hover:text-amber-800" title="تصفير">🔄</button>
                            <button onClick={() => updateMutation.mutate({ id: coupon.id, valid_to: addDaysLocal(coupon.valid_to, 7).toISOString() })} className="text-emerald-600 hover:text-emerald-800" title="+7 أيام">📅</button>
                            <button onClick={() => announceCoupon(coupon)} className="text-blue-600 hover:text-blue-800" title="إعلان">📣</button>
                            <button onClick={() => deleteMutation.mutate(coupon.id)} className="text-red-600 hover:text-red-900" title="حذف"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد كوبونات</h3>
              <p className="text-gray-500 mb-4">ابدأ بإنشاء كوبونات خصم لجذب العملاء</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => { setEditingCoupon(null); setShowModal(true) }} className="btn-primary">إضافة كوبون جديد</button>
                <button onClick={() => generateRandomCouponMutation.mutate()} className="btn-secondary">إنشاء كوبون عشوائي</button>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">إجمالي: {total} | صفحة {page} من {totalPages}</div>
            <div className="flex items-center gap-2">
              <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value)) }} className="input-field w-24">
                {[10, 20, 50].map(s => <option key={s} value={s}>{s}/صفحة</option>)}
              </select>
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn-secondary disabled:opacity-50">السابق</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="btn-secondary disabled:opacity-50">التالي</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey })
          }}
        />
      )}
    </div>
  )
}

// Coupon Modal Component
interface CouponModalProps {
  coupon: Coupon | null
  onClose: () => void
  onSuccess: () => void
}

function CouponModal({ coupon, onClose, onSuccess }: CouponModalProps) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discount_percent: coupon?.discount_percent || 10,
    max_uses: coupon?.max_uses || 100,
    daily_limit: coupon?.daily_limit || 10,
    valid_from: coupon?.valid_from ? new Date(coupon.valid_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    valid_to: coupon?.valid_to ? new Date(coupon.valid_to).toISOString().split('T')[0] : (() => {
      const date = new Date()
      date.setDate(date.getDate() + 30)
      return date.toISOString().split('T')[0]
    })(),
  })
  const [isLoading, setIsLoading] = useState(false)

  const generateRandomCode = () => {
    const randomCode = `DEAL${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setFormData({ ...formData, code: randomCode })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const couponData = {
        ...formData,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
      }

      if (coupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', coupon.id)

        if (error) throw error
        toast.success('تم تحديث الكوبون بنجاح')
      } else {
        // Create new coupon
        const { error } = await supabase
          .from('coupons')
          .insert([{ ...couponData, uses_count: 0 }])

        if (error) throw error
        toast.success('تم إضافة الكوبون بنجاح')
      }

      onSuccess()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('كود الكوبون موجود مسبقاً')
      } else {
        toast.error('حدث خطأ في حفظ الكوبون')
      }
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {coupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كود الكوبون
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="flex-1 input-field font-mono"
                  placeholder="DEAL123"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="btn-secondary text-sm px-3"
                >
                  عشوائي
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نسبة الخصم (%)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                step="5"
                required
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحد الأقصى للاستخدامات
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحد اليومي
              </label>
              <input
                type="number"
                min="1"
                value={formData.daily_limit}
                onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية
              </label>
              <input
                type="date"
                required
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الانتهاء
              </label>
              <input
                type="date"
                required
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}