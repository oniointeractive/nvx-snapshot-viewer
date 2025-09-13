# NVX Snapshot Viewer

A tiny React + TypeScript + Vite app that displays JPEG snapshots from an HTTP endpoint at a fixed interval **without flicker**.

It preloads each frame off-DOM and draws it onto a `<canvas>` only after the image is fully decoded, keeping the previous frame visible the whole time. Works well with endpoints like:

http://host:8080/streams/streamId

> This app intentionally **pulls single JPEG frames** (snapshot pattern). It does not rely on MJPEG.

---

## Features

- Smooth snapshot updates (no `<img>` re-mount flicker)
- Configurable refresh interval
- Runtime URL/interval override via query params
- Minimal footprint (Vite + React + TS)

---

## Requirements

- Node.js 18+
- An accessible HTTP snapshot endpoint returning a single JPEG per request

---

## Quick start

```bash
# 1) Install deps
npm i

# 2) Configure the stream URL
eg. http://192.168.1.101:8080/streams/stream1


# 3) Run dev server
npm run dev
```
