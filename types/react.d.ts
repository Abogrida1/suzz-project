declare module 'react' {
  export * from 'react'
  export = React
  export as namespace React
  
  namespace React {
    interface FC<P = {}> {
      (props: P): JSX.Element | null
    }
    
    interface FormEvent<T = Element> extends SyntheticEvent<T> {
      currentTarget: EventTarget & T
    }
    
    function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void]
    function useEffect(effect: () => void | (() => void), deps?: any[]): void
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T
    function useMemo<T>(factory: () => T, deps: any[]): T
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
  
  interface Element extends React.ReactElement<any, any> { }
  
  interface ElementClass extends React.Component<any> {
    render(): React.ReactNode
  }
}
