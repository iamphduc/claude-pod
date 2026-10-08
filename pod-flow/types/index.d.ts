export type Dispatch = {
  type: string
  description: string
  startedAt?: number
  sprint?: string
  slice?: string
  branch?: string
  /** A reviewer's plan slug and round, from its dispatch. */
  plan?: string
  round?: number
}

export type TreeKind = 'plan' | 'sprint' | 'wave' | 'slice' | 'agent' | 'halt' | 'hint' | 'concern' | 'review' | 'round'

export type TreeLine = {
  depth: number
  kind: TreeKind
  text: string
  status: string
  note?: string
  sprint?: string
  detail?: string
  /** The rest of the row above, drawn under it without a branch of its own. */
  isContinued?: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'pod-flow': {
      isActive: boolean
      lines: TreeLine[]
      spawns: Record<string, Dispatch>
      expanded: string[]
    }
  }
}
