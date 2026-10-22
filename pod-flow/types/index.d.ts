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
  /** The plan the tree showed when it was spawned; '' before the run found one. */
  runPlan?: string
}

export type TreeKind = 'plan' | 'sprint' | 'wave' | 'slice' | 'agent' | 'halt' | 'hint' | 'concern' | 'review' | 'round' | 'ask' | 'question' | 'app' | 'check'

export type TreeLine = {
  depth: number
  kind: TreeKind
  text: string
  status: string
  note?: string
  sprint?: string
  detail?: string
  /** A sprint's blocked slices, shown in red on its folded row. */
  blockedCount?: number
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
      tokens: Record<string, number>
      /** The plan slug this run showed, kept so the tree stays once the plan is archived. */
      planShown: string
      /** Why there is no tree, shown in its place. */
      emptyNote: string
      /** The hand-back checklist's ticked features, and whether Run app was pressed last. */
      ticked: string[]
      isAppRunning: boolean
    }
  }
}
