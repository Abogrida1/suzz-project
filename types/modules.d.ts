declare module '@tanstack/react-query' {
  export function useQuery(options: any): any
  export function useMutation(options: any): any
  export function useQueryClient(): any
  export class QueryClient {
    constructor(options?: any)
    invalidateQueries(options: any): void
  }
  export function QueryClientProvider(props: any): any
}

declare module 'lucide-react' {
  export const Building2: any
  export const Plus: any
  export const Edit: any
  export const Trash2: any
  export const Eye: any
  export const EyeOff: any
  export const Heart: any
  export const DollarSign: any
  export const Package: any
  export const ShoppingCart: any
  export const Clock: any
  export const User: any
  export const Phone: any
  export const Truck: any
  export const Tag: any
  export const Percent: any
  export const Calendar: any
  export const Users: any
  export const Mail: any
  export const Filter: any
  export const Menu: any
  export const LogOut: any
  export const BarChart3: any
  export const TrendingUp: any
  export const X: any
}

declare module 'react-hot-toast' {
  interface Toast {
    success(message: string): void
    error(message: string): void
  }
  const toast: Toast
  export default toast
  export function Toaster(props: any): any
}

declare module 'date-fns' {
  export function format(date: Date, format: string, options?: any): string
}

declare module 'date-fns/locale' {
  export const ar: any
}

declare module 'react-hook-form' {
  export function useForm<T = any>(options?: any): {
    register: any
    handleSubmit: any
    formState: any
    setValue: any
    watch: any
  }
}

declare module '@headlessui/react' {
  export const Dialog: any
  export const Transition: any
}

declare module 'clsx' {
  function clsx(...inputs: any[]): string
  export default clsx
}






