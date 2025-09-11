'use client'

import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  BarChart3,
  Building2,
  Menu,
  Package,
  ShoppingCart,
  Tag,
  Users,
  Truck,
  X,
} from 'lucide-react'
import { ActivePage } from './Dashboard'
import clsx from 'clsx'
// تم إزالة import getAllowedPages لأننا بنستخدم الصفحات من قاعدة البيانات

// Custom icon components for missing icons
const SettingsIcon = ({ className }: { className?: string }) => (
  <span className={`text-lg ${className}`}>⚙️</span>
)

const MailIcon = ({ className }: { className?: string }) => (
  <span className={`text-lg ${className}`}>📧</span>
)

interface SidebarProps {
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  allowedPages: ActivePage[]
}

const navigation = [
  { name: 'لوحة التحكم', href: 'dashboard', icon: BarChart3 },
  { name: 'المطاعم', href: 'restaurants', icon: Building2 },
  { name: 'عناصر القائمة', href: 'menu-items', icon: Package },
  { name: 'الطلبات', href: 'orders', icon: ShoppingCart },
  { name: 'الكوبونات', href: 'coupons', icon: Tag },
  { name: 'المستخدمين', href: 'users', icon: Users },
  { name: 'المناديب', href: 'couriers', icon: Truck },
  { name: 'التقارير', href: 'reports', icon: BarChart3 },
  { name: 'إدارة الموظفين', href: 'staff', icon: SettingsIcon },
  { name: 'الرسائل والإشعارات', href: 'messaging', icon: MailIcon },
]

export default function Sidebar({
  activePage,
  setActivePage,
  sidebarOpen,
  setSidebarOpen,
  allowedPages,
}: SidebarProps) {
  // تصفية القائمة حسب الصفحات المسموحة فعلياً من قاعدة البيانات
  console.log('🔍 Sidebar - Allowed pages:', allowedPages)
  console.log('🔍 Sidebar - All navigation items:', navigation.map(item => item.href))
  
  // فحص مفصل لكل عنصر
  navigation.forEach(item => {
    const isAllowed = allowedPages.includes(item.href as ActivePage)
    console.log(`🔍 Sidebar - ${item.name} (${item.href}): ${isAllowed ? '✅ مسموح' : '❌ ممنوع'}`)
  })
  
  const filteredNavigation = navigation.filter(item => 
    allowedPages.includes(item.href as ActivePage)
  )
  
  console.log('🔍 Sidebar - Filtered navigation:', filteredNavigation.map(item => item.name))
  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as="div">
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as="div"
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as="div"
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative ml-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as="div"
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 px-6 pb-6">
                  {/* Mobile Modern Header */}
                  <div className="flex h-20 shrink-0 items-center justify-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl font-bold">🌱</span>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-800">
                          Greebite
                        </h1>
                        <p className="text-xs text-gray-600 font-medium">لوحة التحكم</p>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-2">
                      <li>
                        <p className="text-xs font-semibold leading-6 text-gray-500 uppercase tracking-wider mb-3">
                          القوائم الرئيسية
                        </p>
                        <ul role="list" className="space-y-2">
                          {navigation.filter(item => allowedPages.includes(item.href as ActivePage)).map((item, index) => (
                            <li key={item.name}>
                              <button
                                onClick={() => {
                                  setActivePage(item.href as ActivePage)
                                  setSidebarOpen(false)
                                }}
                                className={clsx(
                                  item.href === activePage
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-green-700 hover:bg-white/60 hover:shadow-md',
                                  'group flex gap-x-4 rounded-xl p-4 text-sm leading-6 font-semibold w-full text-right transition-all duration-300'
                                )}
                              >
                                <div className={clsx(
                                  item.href === activePage
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600',
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300'
                                )}>
                                  <item.icon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </div>
                                <span className="flex-1">{item.name}</span>
                                {item.href === activePage && (
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modern Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 border-r border-green-100 px-6 py-6 shadow-2xl">
          {/* Modern Header */}
          <div className="flex h-20 shrink-0 items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🌱</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Greebite
                </h1>
                <p className="text-xs text-gray-600 font-medium">لوحة التحكم</p>
              </div>
            </div>
          </div>

          {/* Modern Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              <li>
                <p className="text-xs font-semibold leading-6 text-gray-500 uppercase tracking-wider mb-3">
                  القوائم الرئيسية
                </p>
                <ul role="list" className="space-y-2">
                  {filteredNavigation.map((item, index) => (
                    <li key={item.name}>
                      <button
                        onClick={() => setActivePage(item.href as ActivePage)}
                        className={clsx(
                          item.href === activePage
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                            : 'text-gray-700 hover:text-green-700 hover:bg-white/60 hover:shadow-md hover:scale-102',
                          'group flex gap-x-4 rounded-xl p-4 text-sm leading-6 font-semibold w-full text-right transition-all duration-300 ease-in-out'
                        )}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className={clsx(
                          item.href === activePage
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600',
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300'
                        )}>
                          <item.icon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {item.href === activePage && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* Modern Footer */}
              <li className="mt-auto">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">👤</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">المدير</p>
                      <p className="text-xs text-gray-600">متصل الآن</p>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
