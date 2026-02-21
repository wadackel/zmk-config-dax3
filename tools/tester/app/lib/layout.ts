export type KeySide = 'left' | 'right'

export type KeyTestability =
  | 'keyboard'    // KeyboardEvent で検出
  | 'mouse'       // MouseEvent で検出
  | 'untestable'  // HID 出力なし

export interface KeyDef {
  index: number        // 0-45 の物理キーインデックス
  x: number            // dax3.json の x 座標
  y: number            // dax3.json の y 座標
  label: string        // 表示ラベル
  side: KeySide
  testability: KeyTestability
  eventCode?: string   // KeyboardEvent.code
  eventKey?: string    // KeyboardEvent.key (LANG1/LANG2 等のフォールバック)
  mouseButton?: number // MouseEvent.button
}

export interface EncoderDef {
  id: string
  label: string
  side: KeySide
}

export const KEYS: KeyDef[] = [
  // Row 0 - Left (index 0-5)
  { index: 0,  x: 0,  y: 0, label: 'Tab',   side: 'left',  testability: 'keyboard', eventCode: 'Tab' },
  { index: 1,  x: 1,  y: 0, label: 'Q',     side: 'left',  testability: 'keyboard', eventCode: 'KeyQ' },
  { index: 2,  x: 2,  y: 0, label: 'W',     side: 'left',  testability: 'keyboard', eventCode: 'KeyW' },
  { index: 3,  x: 3,  y: 0, label: 'E',     side: 'left',  testability: 'keyboard', eventCode: 'KeyE' },
  { index: 4,  x: 4,  y: 0, label: 'R',     side: 'left',  testability: 'keyboard', eventCode: 'KeyR' },
  { index: 5,  x: 5,  y: 0, label: 'T',     side: 'left',  testability: 'keyboard', eventCode: 'KeyT' },

  // Row 0 - Right (index 6-11)
  { index: 6,  x: 10, y: 0, label: 'Y',     side: 'right', testability: 'keyboard', eventCode: 'KeyY' },
  { index: 7,  x: 11, y: 0, label: 'U',     side: 'right', testability: 'keyboard', eventCode: 'KeyU' },
  { index: 8,  x: 12, y: 0, label: 'I',     side: 'right', testability: 'keyboard', eventCode: 'KeyI' },
  { index: 9,  x: 13, y: 0, label: 'O',     side: 'right', testability: 'keyboard', eventCode: 'KeyO' },
  { index: 10, x: 14, y: 0, label: 'P',     side: 'right', testability: 'keyboard', eventCode: 'KeyP' },
  { index: 11, x: 15, y: 0, label: '-',     side: 'right', testability: 'keyboard', eventCode: 'Minus' },

  // Row 1 - Left (index 12-17)
  { index: 12, x: 0,  y: 1, label: 'Ctrl',  side: 'left',  testability: 'keyboard', eventCode: 'ControlLeft' },
  { index: 13, x: 1,  y: 1, label: 'A',     side: 'left',  testability: 'keyboard', eventCode: 'KeyA' },
  { index: 14, x: 2,  y: 1, label: 'S',     side: 'left',  testability: 'keyboard', eventCode: 'KeyS' },
  { index: 15, x: 3,  y: 1, label: 'D',     side: 'left',  testability: 'keyboard', eventCode: 'KeyD' },
  { index: 16, x: 4,  y: 1, label: 'F',     side: 'left',  testability: 'keyboard', eventCode: 'KeyF' },
  { index: 17, x: 5,  y: 1, label: 'G',     side: 'left',  testability: 'keyboard', eventCode: 'KeyG' },

  // Row 1 - Right (index 18-23)
  { index: 18, x: 10, y: 1, label: 'H',     side: 'right', testability: 'keyboard', eventCode: 'KeyH' },
  { index: 19, x: 11, y: 1, label: 'J',     side: 'right', testability: 'keyboard', eventCode: 'KeyJ' },
  { index: 20, x: 12, y: 1, label: 'K',     side: 'right', testability: 'keyboard', eventCode: 'KeyK' },
  { index: 21, x: 13, y: 1, label: 'L',     side: 'right', testability: 'keyboard', eventCode: 'KeyL' },
  { index: 22, x: 14, y: 1, label: ';',     side: 'right', testability: 'keyboard', eventCode: 'Semicolon' },
  { index: 23, x: 15, y: 1, label: "'",     side: 'right', testability: 'keyboard', eventCode: 'Quote' },

  // Row 2 - Left (index 24-29)
  { index: 24, x: 0,  y: 2, label: 'Shift', side: 'left',  testability: 'keyboard', eventCode: 'ShiftLeft' },
  { index: 25, x: 1,  y: 2, label: 'Z',     side: 'left',  testability: 'keyboard', eventCode: 'KeyZ' },
  { index: 26, x: 2,  y: 2, label: 'X',     side: 'left',  testability: 'keyboard', eventCode: 'KeyX' },
  { index: 27, x: 3,  y: 2, label: 'C',     side: 'left',  testability: 'keyboard', eventCode: 'KeyC' },
  { index: 28, x: 4,  y: 2, label: 'V',     side: 'left',  testability: 'keyboard', eventCode: 'KeyV' },
  { index: 29, x: 5,  y: 2, label: 'B',     side: 'left',  testability: 'keyboard', eventCode: 'KeyB' },

  // Row 2 - Inner (index 30-31) - BOOT keys
  { index: 30, x: 6,  y: 1.5, label: 'BOOT', side: 'left',  testability: 'untestable' },
  { index: 31, x: 9,  y: 1.5, label: 'BOOT', side: 'right', testability: 'untestable' },

  // Row 2 - Right (index 32-37)
  { index: 32, x: 10, y: 2, label: 'N',     side: 'right', testability: 'keyboard', eventCode: 'KeyN' },
  { index: 33, x: 11, y: 2, label: 'M',     side: 'right', testability: 'keyboard', eventCode: 'KeyM' },
  { index: 34, x: 12, y: 2, label: ',',     side: 'right', testability: 'keyboard', eventCode: 'Comma' },
  { index: 35, x: 13, y: 2, label: '.',     side: 'right', testability: 'keyboard', eventCode: 'Period' },
  { index: 36, x: 14, y: 2, label: '/',     side: 'right', testability: 'keyboard', eventCode: 'Slash' },
  { index: 37, x: 15, y: 2, label: 'MB1',   side: 'right', testability: 'mouse',    mouseButton: 0 },

  // Row 3 - Left thumb (index 38-42)
  { index: 38, x: 2,   y: 3, label: 'mo(5)',  side: 'left',  testability: 'untestable' },
  { index: 39, x: 3,   y: 3, label: 'Alt',    side: 'left',  testability: 'keyboard', eventCode: 'AltLeft' },
  { index: 40, x: 4.5, y: 3, label: 'GUI',    side: 'left',  testability: 'keyboard', eventCode: 'MetaLeft', eventKey: 'Lang2' },
  { index: 41, x: 5.5, y: 3, label: 'Space',  side: 'left',  testability: 'keyboard', eventCode: 'Space' },
  { index: 42, x: 6.5, y: 3, label: 'Esc',    side: 'left',  testability: 'keyboard', eventCode: 'Escape' },

  // Row 3 - Right thumb (index 43-45)
  { index: 43, x: 8.5, y: 3, label: 'Enter',  side: 'right', testability: 'keyboard', eventCode: 'Enter' },
  { index: 44, x: 9.5, y: 3, label: 'LANG1',  side: 'right', testability: 'keyboard', eventCode: 'Lang1', eventKey: 'KanaModeSwitch' },
  { index: 45, x: 13,  y: 3, label: 'MB2',    side: 'right', testability: 'mouse',    mouseButton: 2 },
]

export const ENCODERS: EncoderDef[] = [
  { id: 'left',  label: 'Left Encoder',  side: 'left' },
  { id: 'right', label: 'Right Encoder', side: 'right' },
]

export const TESTABLE_KEY_COUNT = KEYS.filter(k => k.testability !== 'untestable').length
