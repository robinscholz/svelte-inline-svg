# 🖼️ Svelte Inline SVG

A [Svelte](https://github.com/sveltejs/svelte) plugin to inline SVG sources. Ported from [Vue Inline SVG](https://github.com/shrpne/vue-inline-svg).

## Installation

### NPM
``` bash
npm install svelte-inline-svg
```

### Yarn
``` bash
yarn add svelte-inline-svg
```

## Usage
``` html
<script>
  import InlineSVG from 'svelte-inline-svg'

  $: attributes = {
    width: width,
    height: height,
    // ...
  }
</script>

<InlineSVG src={src} attributes={attributes} />
```

## Props

| Prop         | Required | Type       |
| ------------ | -------- | ---------- |
| src          | `true`   | `String`   |
| transformSrc | `false`  | `Function` |
| attributes   | `false`  | `Object`   |


### transformSrc

``` html
<script>
  const transform = (svg) => {
    let point = document.createElementNS("http://www.w3.org/2000/svg", 'circle')
      point.setAttributeNS(null, 'cx', '20')
      point.setAttributeNS(null, 'cy', '20')
      point.setAttributeNS(null, 'r', '10')
      point.setAttributeNS(null, 'fill', 'red')
      svg.appendChild(point)
    return svg
  }
</script>

<InlineSVG src={src} transformSrc={transform} />
```


## Credits
Most of the source code is ported from [Vue Inline SVG](https://github.com/shrpne/vue-inline-svg). 


## License
MIT
