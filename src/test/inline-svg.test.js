import { render, waitFor, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
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

  test('should work onclick event', async () => {
    let clicked = false

    const { container } = render(
      html`<${InlineSVG}
        src="${src}"
        width="50"
        on:click=${() => (clicked = true)}
      />`
    )
    const element = container.querySelector('svg')

    await fireEvent.click(element)
    expect(clicked).toBe(true)
  })
})
