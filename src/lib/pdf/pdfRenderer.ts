import * as pdfjs from 'pdfjs-dist';

export interface RenderPageOptions {
  pageNumber: number;
  scale?: number;
  targetCanvas?: HTMLCanvasElement;
}

export class PDFPageRenderer {
  private doc: pdfjs.PDFDocumentProxy;
  // Cache of pristine (unfiltered) rendered canvases: key = `${pageNumber}_${scale.toFixed(2)}`
  private pristineCanvasCache = new Map<string, HTMLCanvasElement>();
  private activeRenderTasks = new Map<number, pdfjs.RenderTask>();
  private maxCacheSize = 12; // keep memory footprint optimal

  constructor(doc: pdfjs.PDFDocumentProxy) {
    this.doc = doc;
  }

  /**
   * Cancels any active rendering on a specific page
   */
  public cancelPageRender(pageNumber: number): void {
    const activeTask = this.activeRenderTasks.get(pageNumber);
    if (activeTask) {
      try {
        activeTask.cancel();
      } catch {
        // ignore cancellation exception
      }
      this.activeRenderTasks.delete(pageNumber);
    }
  }

  /**
   * Cancel all in-flight render tasks
   */
  public cancelAll(): void {
    for (const [pageNumber] of this.activeRenderTasks) {
      this.cancelPageRender(pageNumber);
    }
  }

  /**
   * Render a page at given scale onto targetCanvas or return a pristine canvas
   */
  public async renderPagePristine(
    pageNumber: number,
    scale: number = 1.5,
    customCanvas?: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    const cacheKey = `${pageNumber}_${scale.toFixed(2)}`;

    // If already cached and no customCanvas is required, return clone/cached
    if (this.pristineCanvasCache.has(cacheKey) && !customCanvas) {
      return this.pristineCanvasCache.get(cacheKey)!;
    }

    // Cancel existing render on this page if running
    this.cancelPageRender(pageNumber);

    const page = await this.doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = customCanvas || document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not get 2D canvas context.');
    }

    // Fill white background before rendering PDF
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    });
    this.activeRenderTasks.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
        // Task was cancelled, ignore
        throw err;
      }
      throw err;
    } finally {
      this.activeRenderTasks.delete(pageNumber);
      page.cleanup();
    }

    // Cache pristine canvas
    if (!customCanvas) {
      if (this.pristineCanvasCache.size >= this.maxCacheSize) {
        // Evict oldest entry
        const firstKey = this.pristineCanvasCache.keys().next().value;
        if (firstKey) this.pristineCanvasCache.delete(firstKey);
      }
      this.pristineCanvasCache.set(cacheKey, canvas);
    }

    return canvas;
  }

  /**
   * Clear cache to free memory
   */
  public clearCache(): void {
    this.cancelAll();
    this.pristineCanvasCache.clear();
  }
}
