import { render } from '@testing-library/svelte'
import InlineSVG from '../inline-svg.svelte'

const src = 'https://raw.githubusercontent.com/robinscholz/svelte-inline-svg/master/src/test/test.svg'

describe('inline-svg', () => {
  test('render component correctly', () => {
    const { container } = render(InlineSVG, {
      props: {
        src: src
      }
    })

    expect(container).toContainHTML('<svg')
  })

  test('has width set', () => {
    const { container } = render(InlineSVG, {
      props: {
        src: src,
        width: 50,
      }
    })
    const element = container.querySelector('svg')
    expect(element).toHaveAttribute('width')
  })
})
