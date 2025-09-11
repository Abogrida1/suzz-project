'use client'

import React from 'react'
import { ActivePage } from './Dashboard'
import { canEdit, canDelete, canAdd } from '@/lib/permissions'

interface PermissionWrapperProps {
  userRole: string
  page: ActivePage
  action: 'view' | 'edit' | 'delete' | 'add'
  children: React.ReactNode
  fallback?: React.ReactNode
}

// مكون للتحكم في عرض العناصر حسب الصلاحيات
export default function PermissionWrapper({ 
  userRole, 
  page, 
  action, 
  children, 
  fallback = null 
}: PermissionWrapperProps) {
  let hasPermission = false

  switch (action) {
    case 'view':
      hasPermission = true // إذا وصل للصفحة يبقى عنده صلاحية عرض
      break
    case 'edit':
      hasPermission = canEdit(userRole, page)
      break
    case 'delete':
      hasPermission = canDelete(userRole, page)
      break
    case 'add':
      hasPermission = canAdd(userRole, page)
      break
    default:
      hasPermission = false
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// مكون خاص للأزرار
interface ActionButtonProps {
  userRole: string
  page: ActivePage
  action: 'edit' | 'delete' | 'add'
  onClick: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function ActionButton({ 
  userRole, 
  page, 
  action, 
  onClick, 
  children, 
  className = '',
  disabled = false 
}: ActionButtonProps) {
  let hasPermission = false
  
  switch (action) {
    case 'edit':
      hasPermission = canEdit(userRole, page)
      break
    case 'delete':
      hasPermission = canDelete(userRole, page)
      break
    case 'add':
      hasPermission = canAdd(userRole, page)
      break
  }

  if (!hasPermission) {
    return null // لا يعرض الزر إذا لم تكن له صلاحية
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

// مكون لعرض رسالة عدم وجود صلاحيات
export function NoPermissionMessage({ action }: { action: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-gray-400 text-lg mb-2">🔒</div>
      <p className="text-gray-500">
        ليس لديك صلاحية {action} في هذا القسم
      </p>
    </div>
  )
}
