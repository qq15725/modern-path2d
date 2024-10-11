<h1 align="center">[WIP] modern-path2d</h1>

<p align="center">
  <a href="https://unpkg.com/modern-path2d">
    <img src="https://img.shields.io/bundlephobia/minzip/modern-path2d" alt="Minzip">
  </a>
  <a href="https://www.npmjs.com/package/modern-path2d">
    <img src="https://img.shields.io/npm/v/modern-path2d.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/modern-path2d">
    <img src="https://img.shields.io/npm/dm/modern-path2d" alt="Downloads">
  </a>
  <a href="https://github.com/qq15725/modern-path2d/issues">
    <img src="https://img.shields.io/github/issues/qq15725/modern-path2d" alt="Issues">
  </a>
  <a href="https://github.com/qq15725/modern-path2d/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/modern-path2d.svg" alt="License">
  </a>
</p>

## Features

- Compatible Web Path2D

- Path animation

- Path transform

- Parse svg to Path2D array

- TypeScript

## 📦 Install

```sh
npm i modern-path2d
```

## 🦄 Usage

```ts
import { parseSvg, Path2D } from 'modern-path2d'

const path = new Path2D()

// base methods
path.arc(75, 75, 50, 0, Math.PI * 2, true)
path.moveTo(110, 75)
path.arc(75, 75, 35, 0, Math.PI, false)
path.moveTo(65, 65)
path.arc(60, 65, 5, 0, Math.PI * 2, true)
path.moveTo(95, 65)
path.arc(90, 65, 5, 0, Math.PI * 2, true)

// add path data
path.addData('M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z M5,5 L90,90')

// add path commands
path.addCommands([
  { type: 'M', x: 118, y: 39 },
  { type: 'L', x: 218, y: 39 }
])

// add svg
const parsedPaths = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
<path d="M51.3646 45.8642C49.7808 46.2782 47.906 46.705 45.8588 47.0857M45.8588 47.0857C34.1649 49.2607 16.8486 49.9343 16.0277 38.1484C15.22 26.5533 32.264 22.3636 45.6135 24.5626C53.601 25.8783 57.4507 29.6208 57.9285 34.237C58.2811 37.6435 55.778 43.3702 45.8588 47.0857ZM45.8588 47.0857C42.3367 48.4051 37.8795 49.4708 32.283 50.0891" stroke="#FFC300" stroke-width="2.5" stroke-linecap="round"/>
</svg>`)
parsedPaths.forEach((parsedPath) => {
  path.addPath(parsedPath)
})

// export to ctx
path.strokeTo(document.getElementById('canvas').getContext('2d'))

// export path data
console.log(path.getData())

// export path commands
console.log(path.getCommands())
```
