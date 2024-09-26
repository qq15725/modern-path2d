<h1 align="center">modern-path2d</h1>

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

## 📦 Install

```sh
npm i modern-path2d
```

## 🦄 Usage

```ts
import { Path2D } from 'modern-path2d'

const path = new Path2D()
path.arc(75, 75, 50, 0, Math.PI * 2, true)
path.moveTo(110, 75)
path.arc(75, 75, 35, 0, Math.PI, false)
path.moveTo(65, 65)
path.arc(60, 65, 5, 0, Math.PI * 2, true)
path.moveTo(95, 65)
path.arc(90, 65, 5, 0, Math.PI * 2, true)

path.strokeTo(document.getElementById('canvas1').getContext('2d'))
```
