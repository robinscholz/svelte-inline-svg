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

<InlineSVG src={src} {...attributes} />
```

## Credits
Most of the source code is ported from [Vue Inline SVG](https://github.com/shrpne/vue-inline-svg). 


## License
MIT