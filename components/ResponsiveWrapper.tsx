import React from 'react'

interface ResponsiveWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function ResponsiveWrapper({ 
  children, 
  title, 
  subtitle, 
  actions 
}: ResponsiveWrapperProps) {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  )
}

// Responsive Stats Grid Component
interface StatsGridProps {
  children: React.ReactNode
}

export function ResponsiveStatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
      {children}
    </div>
  )
}

// Responsive Table Component
interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className="card">
      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className={`min-w-full ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveCard({ children, className = '' }: ResponsiveCardProps) {
  return (
    <div className={`card p-4 sm:p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  )
}






