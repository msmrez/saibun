# Generate icons from logo.png

Generates favicon and icon files from `public/logo.png`.

## One-time setup

```bash
pnpm add -D sharp to-ico
```

## Run

```bash
pnpm run generate-icons
```

## Generated files (in `public/`)

| File | Use |
|------|-----|
| `favicon.ico` | Browser tab icon (multi-size 16, 32, 48) |
| `favicon-16x16.png` | Small favicon |
| `favicon-32x32.png` | Standard favicon |
| `icon-32x32.png` | 32×32 icon |
| `icon-192x192.png` | PWA / Android |
| `apple-touch-icon.png` | iOS home screen (180×180) |
| `icon.svg` | Scalable icon (references logo.png) |

If `to-ico` is not installed, the script skips `favicon.ico` and still generates all PNGs and `icon.svg`.
