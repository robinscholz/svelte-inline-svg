import { render, waitFor, fireEvent } from '@testing-library/svelte'
import { nativeEvents } from '../utils/forwardEvents.js'
import InlineSVG from '../index.js'

const src =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+CiAgPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIi8+Cjwvc3ZnPg=='

describe('inline-svg', () => {
  test('render component correctly', () => {
    const { container } = render(InlineSVG, {
      props: {
        src: src,
      },
    })

    expect(container).toContainHTML('svg')
  })

  test('has width set', () => {
    const { container } = render(InlineSVG, {
      props: {
        src: src,
        width: 50,
      },
    })
    const element = container.querySelector('svg')
    expect(element).toHaveAttribute('width')
  })

  test('transformSrc is working', async () => {
    const doc = document
    const transform = (svg) => {
      let point = doc.createElementNS('http://www.w3.org/2000/svg', 'circle')
      point.setAttributeNS(null, 'cx', '20')
      point.setAttributeNS(null, 'cy', '20')
      point.setAttributeNS(null, 'r', '10')
      point.setAttributeNS(null, 'fill', 'red')
      svg.appendChild(point)
      return svg
    }
    const { container } = render(InlineSVG, {
      props: {
        src: src,
        transformSrc: transform,
      },
    })

    const element = container.querySelector('svg')
    await waitFor(() => {
      expect(element).toContainHTML('circle')
    })
  })

  for (const event of nativeEvents) {
    test(`${event} event`, async () => {
      let clicked = false

      const { container, component } = render(InlineSVG, {
        props: {
          src: src,
          width: 50,
        },
      })

      component.$on(event, () => (clicked = true))
      const element = container.querySelector('svg')
  
      await fireEvent(
        element,
        new MouseEvent(event, {
          bubbles: true,
          cancelable: true,
        }),
      )

      expect(clicked).toBe(true)
    })
  }

})
