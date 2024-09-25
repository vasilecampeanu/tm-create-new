import sharp from 'sharp';
import svg2png from 'svg2png';

import path from 'path';
import { promises as fs } from 'fs';

import { createDirectory, folderExists } from '../utils/FileUtils';
import { IConfig } from '../../typings/IConfig';

export class ImageRenderer {
    private sourceSVG: Buffer | null;
    private config: IConfig;

    private constructor(config: IConfig, svgPath: string) {
        this.sourceSVG = null;
        this.config = config;
    }

    public static async create(config: IConfig, svgPath: string): Promise<ImageRenderer> {
        const instance = new ImageRenderer(config, svgPath);
        await instance.initialize(svgPath);
        return instance;
    }

    private async initialize(svgPath: string): Promise<void> {
        this.sourceSVG = await this.readSVGFile(svgPath);
    }

    private async readSVGFile(inputSVGPath: string): Promise<Buffer> {
        try {
            await fs.access(inputSVGPath);
            return await fs.readFile(inputSVGPath);
        } catch (err) {
            throw new Error(`File not found at path: ${inputSVGPath}`);
        }
    };

    private async readImageFile(inputImagePath: string): Promise<Buffer> {
        try {
            await fs.access(inputImagePath);
            return await fs.readFile(inputImagePath);
        } catch (err) {
            throw new Error(`File not found at path: ${inputImagePath}`);
        }
    };

    public async convert(size: number, backgroundColorHex?: string, overlayImagePath?: string): Promise<any> {
        if (!this.sourceSVG) {
            throw new Error('SVG data not loaded.');
        }

        try {
            const buffer = await svg2png(this.sourceSVG);
            let sharpInstance = sharp(buffer)
                .resize(size, size)
                .png();

            if (backgroundColorHex) {
                sharpInstance = sharpInstance.flatten({ background: backgroundColorHex });
            }

            if (overlayImagePath) {
                const overlayBuffer = await this.readImageFile(overlayImagePath);
                const resizedOverlayBuffer = await sharp(overlayBuffer).resize(size, size).toBuffer();
                sharpInstance = sharpInstance.composite([{ input: resizedOverlayBuffer, gravity: 'centre' }]);
            }

            const outputBuffer = await sharpInstance.toBuffer();

            return outputBuffer;
        } catch (err: any) {
            throw new Error('Failed to convert SVG to PNG: ' + err.message);
        }
    }

    public async saveConvertedSVG(
        outputPath: string,
        size: number,
        backgroundColorHex?: string | undefined,
        overlayImagePath?: string
    ): Promise<void> {
        if (!(await folderExists(path.dirname(outputPath)))) {
            createDirectory(path.dirname(outputPath));
        }
    
        try {
            const buffer = await this.convert(size, backgroundColorHex, overlayImagePath);
            await sharp(buffer).toFile(outputPath);
        } catch (err: any) {
            throw new Error(`Failed to save file: ${outputPath}. Error: ${err.message}`);
        }
    }    

    public async generateImageSet(
        outputPath: string,
        imageBaseSizes: number[],
        imageScales: number[],
        excludedSizes: number[] = [],
        outputImagePrefix = "logo_image_",
        includeSizeInFileName: boolean = true
    ): Promise<void> {
        if (!(await folderExists(outputPath))) {
            createDirectory(outputPath);
        }

        for (let baseSize of imageBaseSizes) {
            let fileName = outputImagePrefix;
            if (includeSizeInFileName) {
                fileName += baseSize;
            }

            const scalesToUse = excludedSizes.includes(baseSize) ? [1] : imageScales;

            for (let scale of scalesToUse) {
                const outputFileName = scale === 1 ? `${fileName}.png` : `${fileName}@${scale}x.png`;
                const outputFilePath = path.join(outputPath, outputFileName);

                try {
                    const buffer = await this.convert(baseSize * scale);
                    await sharp(buffer).toFile(outputFilePath);
                } catch (err: any) {
                    throw new Error(`Failed to write file: ${outputFileName}. Error: ${err.message}`);
                }
            }
        }
    }

    public async generateIosImageSet(outputPath: string, overlayPath?: string): Promise<void> {
        if (!(await folderExists(outputPath))) {
            createDirectory(outputPath);
        }

        for (let item of this.config.ios.iosImageSizes) {
            const { size, scale } = item;

            let fileName;
            if (size === 1024) {
                fileName = `MarketingIcon1024.png`;
            } else {
                fileName = `Icon-${size}@${scale}x.png`;
            }

            const outputFilePath = path.join(outputPath, fileName);

            try {
                const buffer = await this.convert(size * scale, "#ffffff", overlayPath);
                await sharp(buffer).toFile(outputFilePath);
            } catch (err: any) {
                throw new Error(`Failed to write file: ${fileName}. Error: ${err.message}`);
            }
        }
    }

    public async generateAndroidImageSet(
        outputPath: string,
        splashscreenImageName = 'splashscreen_image.png',
    ): Promise<void> {
        if (!(await folderExists(outputPath))) {
            createDirectory(outputPath);
        }
    
        for (const [folder, size] of Object.entries(this.config.android.androidSizes)) {
            const folderPath = path.join(outputPath, folder);
            
            if (!(await folderExists(folderPath))) {
                createDirectory(folderPath);
            }
            
            const outputFilePath = path.join(folderPath, splashscreenImageName);
    
            try {
                const buffer = await this.convert(size);
                await sharp(buffer).toFile(outputFilePath);
            } catch (err: any) {
                throw new Error(`Failed to write file: ${splashscreenImageName} in ${folder}. Error: ${err.message}`);
            }
        }
    }    
}
