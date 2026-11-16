# PDF Color Studio 🎨📄

> **Transform Your PDFs with Beautiful Colors**  
> A fast, privacy-first, client-side web application to preview, color-grade, binarize, and download customized PDF documents in seconds.

---

## ✨ Features

- **25+ Photo-Style Presets**:
  - **Basic**: *Original, Grayscale, Real 1-Bit Black & White, High Contrast, Light, Dark*
  - **Artistic**: *Sepia, Vintage, Warm, Cool, Faded, Retro*
  - **Color Tones**: *Red, Blue, Green, Purple, Orange, Pink, Yellow*
  - **Special & Duo**: *Invert Colors, Negative, Monochrome, Duotone, Hollywood Cinematic, Soft Contrast*
- **Real 1-Bit B&W Thresholding**: True scan binarization with an adjustable threshold slider (not just ordinary grayscale).
- **Fine-Tune Adjustments**: Smooth, debounced sliders for Brightness, Contrast, Saturation, Exposure, Temperature, Hue, and 3×3 matrix unsharp mask Sharpness.
- **Instant 60fps Previews**: Single-pass pixel shaders rendered on HTML5 Canvas via `requestAnimationFrame`. Zero re-rendering of base vector assets when moving sliders.
- **Flexible Scope Control**: Apply color presets to individual pages or batch-apply to all pages with one click.
- **High-DPI PDF & Image Export**:
  - Standard (150 DPI)
  - High Quality (200 DPI)
  - Print Quality (300 DPI)
  - Preserves exact page dimensions, aspect ratios, and page order.
  - Also export any page as PNG or JPG.
- **100% Local & Private**: All PDF processing happens inside your browser using WebAssembly and Canvas. No files or images are ever uploaded to a server.
- **Built-in Sample PDF**: Try out every feature instantly without needing an external PDF document.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide React
- **PDF Engine**: PDF.js (`pdfjs-dist`) WebAssembly worker
- **Export Engine**: `jsPDF` for multi-page document generation
- **Celebration Effects**: `canvas-confetti`

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js 18+ (tested on Node v20 & v26)
- npm or pnpm

### Installation

1. Clone or navigate into the project directory:
   ```bash
   cd "pdf edit"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at the displayed local URL (typically `http://localhost:5173`).

---

## 📦 Production Build

To build the optimized static assets:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment

PDF Color Studio is a 100% static client-side web application and requires zero backend server configuration.

### Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Framework Preset: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy**.

### Deploying to Netlify

1. Go to [Netlify](https://app.netlify.com) and click **"Add new site" > "Import an existing project"**.
2. Select your repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Click **Deploy Site**.

Alternatively, with the Netlify CLI:
```bash
npx netlify deploy --prod --dir=dist
```

---

## 🔒 Security & Privacy Architecture

- **Zero Cloud Uploads**: The application has no backend upload endpoints. Documents are read into browser memory via `FileReader` and `ArrayBuffer`.
- **Sandbox Processing**: PDF vector rendering is managed by PDF.js workers, isolated from network requests.
- **Zero Account Tracking**: No cookies, user identifiers, or cloud storage databases are utilized.

---

## 📄 License

MIT License. Free for personal and commercial use.
