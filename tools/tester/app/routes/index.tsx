import { createRoute } from 'honox/factory'
import KeyboardTester from '../islands/keyboard-tester'

export default createRoute((c) => {
  return c.render(<KeyboardTester />)
})
