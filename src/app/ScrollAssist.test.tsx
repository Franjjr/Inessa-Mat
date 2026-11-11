import { render } from '@testing-library/react'
import { ScrollAssist } from './ScrollAssist'

describe('ScrollAssist · no polling', () => {
  it('checks the page when it changes, not on a timer', () => {
    const setInterval = vi.spyOn(window, 'setInterval')
    const { unmount } = render(<ScrollAssist />)
    expect(setInterval).not.toHaveBeenCalledWith(expect.any(Function), 500)
    unmount()
    setInterval.mockRestore()
  })
})
