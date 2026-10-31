/** The name of the game being worked on, as shown above the prompt. */
export type GameName = string

declare module 'claude-code' {
  interface PluginState {
    gg: { game: GameName | null }
  }
}
