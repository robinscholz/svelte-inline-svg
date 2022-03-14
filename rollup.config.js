import copy from 'rollup-plugin-copy'
import svelte from 'rollup-plugin-svelte'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const pkg = require('./package.json')

export default {
  input: 'src/inline-svg.svelte',
  output: [
    { file: pkg.module, format: 'es' },
    {
      file: pkg.main,
      format: 'umd',
      name: 'svelte-inline-svg',
    },
  ],
  plugins: [
    svelte(),
    nodeResolve(),
    terser(),
    copy({ targets: [{ src: 'src/index.d.ts', dest: 'dist' }] }),
  ],
}
