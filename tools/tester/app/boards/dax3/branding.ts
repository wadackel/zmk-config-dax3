import type { BoardBranding } from '../types'

export const branding: BoardBranding = {
  title: 'dax3 Keyboard Tester',
  shortLabel: 'dax3',
  subtitle: (layerCount) => `dax3 · 46 keys · ${layerCount} layers`,
  encoderLabel: '2 rotary encoders',
  gestureLabel: 'trackball · stroke directions',
  testerHeaderLabel: (keyCount) => `dax3 · ${keyCount} keys · Auto-detect keyboard chatter`,
  pngFileName: 'dax3-layers.png',
  reloadGuardSymbolKey: 'dax3-keymap-reload-guard',
}
