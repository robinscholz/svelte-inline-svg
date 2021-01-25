# 🖼️ Svelte Inline SVG

[![Build Status](https://flat.badgen.net/travis/robinscholz/svelte-inline-svg)](https://travis-ci.com/robinscholz/svelte-inline-svg)
[![Build Status](https://flat.badgen.net/bundlephobia/minzip/svelte-inline-svg)](https://bundlephobia.com/result?p=svelte-inline-svg)
[![Twitter](https://flat.badgen.net/badge/twitter/RobinScholz)](https://twitter.com/RobinScholz)

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

> **WARNING**: For SSR, please install the package as a dev dependency. More info [here](https://github.com/sveltejs/sapper-template#using-external-components).

## Usage
``` html
<script>
  import InlineSVG from 'svelte-inline-svg'
</script>

<InlineSVG src={src} />
```

## Props

| Prop            | Required | Type       |
| --------------- | -------- | ---------- |
| src             | `true`   | `String`   |
| transformSrc    | `false`  | `Function` |
| {...attributes} | `false`  | `Object`   |

### src
The `src` can either be a path or a base64-encoded string. 

```
const src = '/path/to/file.svg'
```
or
```
const src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZG...'
```

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

### attributes
Attributes which are directly set, will overwrite any attributes that may be inlined in the `src`.

> **WARNING**: Make sure you only set [valid attributes](https://developer.mozilla.org/de/docs/Web/SVG/Attribute)

``` html
<script>
  $: attributes = {
    width: width,
    height: height,
    // ...
  }
</script
  
<InlineSVG src={src} {...attributes} />
```

## Credits
Most of the source code is ported from [Vue Inline SVG](https://github.com/shrpne/vue-inline-svg). 


## License
MIT
