'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Download, Filter, BarChart3, Calendar } from 'lucide-react'

type Grouping = 'day' | 'week' | 'month'

interface OrderRow {
  id: string
  total_price: number
  status: string
  created_at: string
  restaurant_id: string
}

interface RestaurantRow { id: string; name: string }

interface TimeSeriesPoint { label: string; dateKey: string; revenue: number; orders: number }

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  preparing: '#FB923C',
  assigned: '#8B5CF6',
  out_for_delivery: '#6366F1',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

export default function ReportsPage() {
  const [grouping, setGrouping] = useState<Grouping>('day')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = endOfDay(new Date())
    const start = startOfDay(subDays(end, 6))
    return { start, end }
  })

  const { data: restaurants } = useQuery({
    queryKey: ['reports-restaurants'],
    queryFn: async () => {
      const { data } = await supabase.from('restaurants').select('id, name')
      return (data || []) as RestaurantRow[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: orders, isLoading } = useQuery({
    queryKey: ['reports-orders', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at, restaurant_id')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
      return (data || []) as OrderRow[]
    },
  })

  const restaurantsMap = useMemo(() => {
    const map: Record<string, string> = {}
    restaurants?.forEach((r) => (map[r.id] = r.name))
    return map
  }, [restaurants])

  const summary = useMemo(() => {
    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((s, o) => s + (o.total_price || 0), 0) || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const cancelled = orders?.filter((o) => o.status === 'cancelled').length || 0
    const cancellationRate = totalOrders > 0 ? (cancelled / totalOrders) * 100 : 0
    return { totalOrders, totalRevenue, avgOrderValue, cancellationRate }
  }, [orders])

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    orders?.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [orders])

  const timeBuckets = useMemo<TimeSeriesPoint[]>(() => {
    if (!orders) return []
    const bucket = new Map<string, TimeSeriesPoint>()
    const addToBucket = (key: string, label: string, order: OrderRow) => {
      const current = bucket.get(key) || { label, dateKey: key, revenue: 0, orders: 0 }
      current.revenue += order.total_price || 0
      current.orders += 1
      bucket.set(key, current)
    }

    orders.forEach((o) => {
      const d = new Date(o.created_at)
      let key = ''
      let label = ''
      if (grouping === 'day') {
        key = format(d, 'yyyy-MM-dd')
        label = format(d, 'dd MMM', { locale: ar })
      } else if (grouping === 'week') {
        const startW = startOfWeek(d, { weekStartsOn: 6 })
        const endW = endOfWeek(d, { weekStartsOn: 6 })
        key = `${format(startW, 'yyyy-MM-dd')}_${format(endW, 'yyyy-MM-dd')}`
        label = `${format(startW, 'dd MMM', { locale: ar })} - ${format(endW, 'dd MMM', { locale: ar })}`
      } else {
        key = format(d, 'yyyy-MM')
        label = format(d, 'MMMM yyyy', { locale: ar })
      }
      addToBucket(key, label, o)
    })

    // Sort by dateKey ascending
    return Array.from(bucket.values()).sort((a, b) => (a.dateKey > b.dateKey ? 1 : -1))
  }, [orders, grouping])

  const topRestaurants = useMemo(() => {
    const byRestaurant: Record<string, { id: string; name: string; orders: number; revenue: number }> = {}
    orders?.forEach((o) => {
      const name = restaurantsMap[o.restaurant_id] || 'غير معروف'
      if (!byRestaurant[o.restaurant_id]) {
        byRestaurant[o.restaurant_id] = { id: o.restaurant_id, name, orders: 0, revenue: 0 }
      }
      byRestaurant[o.restaurant_id].orders += 1
      byRestaurant[o.restaurant_id].revenue += o.total_price || 0
    })
    return Object.values(byRestaurant)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [orders, restaurantsMap])

  const presetRanges = [
    { key: 'today', label: 'اليوم', get: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
    { key: 'yesterday', label: 'أمس', get: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
    { key: '7d', label: 'آخر 7 أيام', get: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
    { key: '30d', label: 'آخر 30 يوم', get: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }) },
    { key: 'thisMonth', label: 'هذا الشهر', get: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
    { key: 'lastMonth', label: 'الشهر الماضي', get: () => {
      const firstThis = startOfMonth(new Date())
      const lastPrev = subDays(firstThis, 1)
      return { start: startOfMonth(lastPrev), end: endOfMonth(lastPrev) }
    } },
  ]

  function exportCsv(rows: any[], filename: string) {
    if (!rows?.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl border border-white/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">التقارير</h1>
              <p className="text-gray-600 mt-1">تقارير تفصيلية باليوم والأسبوع والشهر</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-white rounded-2xl border px-3 py-2 shadow-sm">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <input
                type="date"
                value={format(dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange((r) => ({ ...r, start: startOfDay(new Date(e.target.value)) }))}
                className="border-0 focus:ring-0 rounded-lg bg-transparent"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={format(dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange((r) => ({ ...r, end: endOfDay(new Date(e.target.value)) }))}
                className="border-0 focus:ring-0 rounded-lg bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 bg-white rounded-2xl border px-2 py-1 shadow-sm">
              <button onClick={() => setGrouping('day')} className={`px-3 py-1.5 rounded-xl text-sm ${grouping === 'day' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>يومي</button>
              <button onClick={() => setGrouping('week')} className={`px-3 py-1.5 rounded-xl text-sm ${grouping === 'week' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>أسبوعي</button>
              <button onClick={() => setGrouping('month')} className={`px-3 py-1.5 rounded-xl text-sm ${grouping === 'month' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>شهري</button>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-2xl border px-2 py-1 shadow-sm">
              {presetRanges.map((p) => (
                <button key={p.key} onClick={() => setDateRange(p.get())} className="px-3 py-1.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100">
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportCsv(timeBuckets, `timeseries_${grouping}.csv`)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-2xl shadow-md hover:shadow-lg"
              title="تصدير CSV"
            >
              <Download className="h-4 w-4" />
              تصدير
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow border">
          <p className="text-sm text-gray-600">إجمالي الطلبات</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalOrders.toLocaleString('ar-EG')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow border">
          <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalRevenue.toFixed(2)} ج.م</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow border">
          <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary.avgOrderValue.toFixed(2)} ج.م</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow border">
          <p className="text-sm text-gray-600">معدل الإلغاء</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary.cancellationRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow border xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">الإيرادات عبر الزمن</h3>
            <button onClick={() => exportCsv(timeBuckets, `revenue_timeseries_${grouping}.csv`)} className="text-sm text-emerald-700 hover:underline">تصدير</button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeBuckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">حالة الطلبات</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">عدد الطلبات عبر الزمن</h3>
            <button onClick={() => exportCsv(timeBuckets.map(t => ({ label: t.label, orders: t.orders })), `orders_timeseries_${grouping}.csv`)} className="text-sm text-emerald-700 hover:underline">تصدير</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow border xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">أفضل المطاعم حسب الإيراد</h3>
            <button onClick={() => exportCsv(topRestaurants, 'top_restaurants.csv')} className="text-sm text-emerald-700 hover:underline">تصدير</button>
          </div>
          <div className="responsive-table">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المطعم</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الطلبات</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإيراد</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topRestaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{r.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-700">{r.orders}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{r.revenue.toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-gray-500">جار تحميل البيانات...</div>
      )}
    </div>
  )
}


