declare module 'react-simple-maps' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react'

  export const ComposableMap: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const Geographies: ComponentType<Record<string, unknown> & { children?: (props: { geographies: any[] }) => ReactNode }>
  export const Geography: ComponentType<Record<string, unknown> & { geography?: any; style?: Record<string, CSSProperties> }>
  export const Marker: ComponentType<Record<string, unknown> & { coordinates?: [number, number]; children?: ReactNode }>
  export const Annotation: ComponentType<Record<string, unknown> & { subject?: [number, number]; dx?: number; dy?: number; connectorProps?: Record<string, unknown>; children?: ReactNode }>
}
