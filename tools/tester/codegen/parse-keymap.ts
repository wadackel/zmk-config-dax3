export interface ParsedBinding {
  behavior: string   // 'kp', 'lt', 'mt', 'mo', 'mkp', 'bootloader', etc.
  args: string[]     // ['Q'], ['4', 'SEMICOLON'], ['LEFT_GUI', 'LANG2'], etc.
}

/**
 * Extracts default layer key bindings from ZMK keymap source.
 * Returns one ParsedBinding per physical key position (46 entries for dax3).
 */
export function parseDefaultLayerBindings(keymapContent: string): ParsedBinding[] {
  // Match the default_layer block
  const blockMatch = keymapContent.match(/default_layer\s*\{([\s\S]*?)\}/)
  if (!blockMatch) {
    throw new Error('Could not find default_layer block in keymap')
  }
  const block = blockMatch[1]

  // Split off sensor-bindings to avoid matching it as key bindings
  const [keyBindingsPart] = block.split('sensor-bindings')

  // Extract the content inside bindings = <...>
  const bindingsMatch = keyBindingsPart.match(/bindings\s*=\s*<([\s\S]*?)>/)
  if (!bindingsMatch) {
    throw new Error('Could not find bindings in default_layer')
  }
  const content = bindingsMatch[1]

  // Split on & to get individual binding tokens
  // Each token starts with the behavior name followed by its arguments
  return content
    .split('&')
    .map(token => token.trim().split(/\s+/).filter(s => s.length > 0))
    .filter(parts => parts.length > 0)
    .map(parts => ({
      behavior: parts[0],
      args: parts.slice(1),
    }))
}
