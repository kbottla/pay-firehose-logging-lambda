import type { BuildOptions } from 'esbuild'

const {version, name, main, engines} = require('./package.json')
const { build } = require('esbuild')
const fs = require('fs')
const archiver = require('archiver')
const common: BuildOptions = {
  logLevel: 'info',
  bundle: true,
  minify: false,
}

build({
  ...common,
  platform: 'node',
  entryPoints: ['src/index.ts'],
  outfile: `dist/${main}`,
  target: `node${engines['node']}`
}).then(() => {
  const output = fs.createWriteStream(__dirname + `/dist/${name}-v${version}.zip`)
  const archive = archiver('zip', {
    zlib: {level: 9},
  })
  archive.pipe(output)
  const lambdaCode = __dirname + `/dist/${main}`
  archive.append(fs.createReadStream(lambdaCode), {name: main})
  archive.finalize()
})
