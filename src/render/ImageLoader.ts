/**
 * ImageLoader.ts
 * Simple utility to load and cache images (Tilesets, Sprites).
 */


export interface ImageLoaderOptions {
    removeWhiteBackground?: boolean;
}

export class ImageLoader {
    private static cache: Map<string, HTMLImageElement> = new Map();

    static async load(src: string, options?: ImageLoaderOptions): Promise<HTMLImageElement> {
        const cacheKey = src + (options?.removeWhiteBackground ? '_transparent' : '');
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.crossOrigin = "Anonymous"; // Required for canvas manipulation if external (though local is fine)

            img.onload = () => {
                if (options?.removeWhiteBackground) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(img);
                        return;
                    }

                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;

                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // Strict White Check (or near white)
                        if (r === 255 && g === 255 && b === 255) {
                            data[i + 3] = 0; // Alpha 0
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);

                    const processedImg = new Image();
                    processedImg.src = canvas.toDataURL();
                    processedImg.onload = () => {
                        this.cache.set(cacheKey, processedImg);
                        resolve(processedImg);
                    };
                } else {
                    this.cache.set(cacheKey, img);
                    resolve(img);
                }
            };
            img.onerror = (err) => {
                console.error(`Failed to load image: ${src}`, err);
                reject(err);
            };
        });
    }

    static get(src: string): HTMLImageElement | undefined {
        return this.cache.get(src);
    }
}
