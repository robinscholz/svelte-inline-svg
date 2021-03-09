<script>
  import { onMount, createEventDispatcher, tick } from 'svelte'

  const dispatch = createEventDispatcher()

  export let src
  export let transformSrc = (svg) => svg

  onMount(() => {
    inline(src)
  })

  let cache = {}
  let isLoaded = false
  let svgAttrs = {}
  let svgContent

  function exclude(obj, exclude) {
    Object.keys(obj)
      .filter((key) => exclude.includes(key))
      .forEach((key) => delete obj[key])
    return obj
  }

  function filterAttrs(attrs) {
    return Object.keys(attrs).reduce((result, key) => {
      if (
        attrs[key] !== false &&
        attrs[key] !== null &&
        attrs[key] !== undefined
      ) {
        result[key] = attrs[key]
      }
      return result
    }, {})
  }

  function download(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open('GET', url, true)

      request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
          try {
            // Setup a parser to convert the response to text/xml in order for it to be manipulated and changed
            const parser = new DOMParser()
            const result = parser.parseFromString(
              request.responseText,
              'text/xml'
            )
            let svgEl = result.querySelector('svg')
            if (svgEl) {
              // Apply transformation
              svgEl = transformSrc(svgEl)
              resolve(svgEl)
            } else {
              reject(new Error('Loaded file is not valid SVG"'))
            }
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error('Error loading SVG'))
        }
      }

      request.onerror = reject
      request.send()
    })
  }

  function inline(src) {
    // fill cache by src with promise
    if (!cache[src]) {
      // notify svg is unloaded
      if (isLoaded) {
        isLoaded = false
        dispatch('unloaded')
      }
      // download
      cache[src] = download(src)
    }

    // inline svg when cached promise resolves
    cache[src]
      .then(async (svg) => {
        // copy attrs
        const attrs = svg.attributes
        for (let i = attrs.length - 1; i >= 0; i--) {
          svgAttrs[attrs[i].name] = attrs[i].value
        }
        // copy inner html
        svgContent = svg.innerHTML
        // render svg element
        await tick()
        isLoaded = true
        dispatch('loaded')
      })
      .catch((error) => {
        // remove cached rejected promise so next image can try load again
        delete cache[src]
        console.error(error)
      })
  }
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  bind:innerHTML={svgContent}
  {...svgAttrs}
  {...exclude($$props, ['src', 'transformSrc'])}
  contenteditable="true" />
