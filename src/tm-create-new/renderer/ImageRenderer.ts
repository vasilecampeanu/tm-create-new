import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { IConfig } from '../../typings/IConfig';
import { createDirectory, folderExists, resolveAndValidatePath } from '../utils/FileUtils';

export class ImageRenderer {
    private sourceSVG: Buffer;
    private config: IConfig;

    private constructor(config: IConfig, svgBuffer: Buffer) {
        this.sourceSVG = svgBuffer;
        this.config = config;
    }

    public static async create(config: IConfig, svgPath: string): Promise<ImageRenderer> {
        const resolvedSvgPath = await resolveAndValidatePath(svgPath);
        const svgBuffer = await ImageRenderer.readFile(resolvedSvgPath);

        return new ImageRenderer(config, svgBuffer);
    }

    private static async readFile(filePath: string): Promise<Buffer> {
        try {
            const resolvedPath = await resolveAndValidatePath(filePath);
            const stats = await fs.lstat(resolvedPath);

            if (!stats.isFile()) {
                throw new Error(`Path is not a file: ${filePath}`);
            }

            return await fs.readFile(resolvedPath);
        } catch (err: any) {
            console.error(`Error reading file: ${err.message}`);
            throw err;
        }
    }

    private async convert(
        size: number,
        backgroundColorHex?: string,
        overlayImagePath?: string
    ): Promise<Buffer> {
        try {
            let image = sharp(this.sourceSVG)
                .resize(size, size)
                .png();

            if (backgroundColorHex) {
                image = image.flatten({ background: backgroundColorHex });
            }

            if (overlayImagePath) {
                const overlayResolvedPath = await resolveAndValidatePath(overlayImagePath);
                const overlayBuffer = await ImageRenderer.readFile(overlayResolvedPath);
                const resizedOverlayBuffer = await sharp(overlayBuffer)
                    .resize(size, size)
                    .toBuffer();

                image = image.composite([{ input: resizedOverlayBuffer, gravity: 'centre' }]);
            }

            return await image.toBuffer();
        } catch (err: any) {
            console.error(`Error during image conversion: ${err.message}`);
            throw err;
        }
    }

    public async saveConvertedSVG(
        outputPath: string,
        size: number,
        backgroundColorHex?: string,
        overlayImagePath?: string
    ): Promise<void> {
        try {
            const resolvedOutputPath = await resolveAndValidatePath(outputPath);
            const outputDir = path.dirname(resolvedOutputPath);

            if (!(await folderExists(outputDir))) {
                await createDirectory(outputDir);
            }

            const buffer = await this.convert(size, backgroundColorHex, overlayImagePath);
            await sharp(buffer).toFile(resolvedOutputPath);
            console.log(`Saved converted SVG: ${resolvedOutputPath}`);
        } catch (err: any) {
            console.error(`Error saving converted SVG: ${err.message}`);
            throw err;
        }
    }

    public async generateImageSet(
        outputPath: string,
        imageBaseSizes: number[],
        imageScales: number[],
        excludedSizes: number[] = [],
        outputImagePrefix = 'logo_image_',
        includeSizeInFileName = true
    ): Promise<void> {
        try {
            const resolvedOutputPath = await resolveAndValidatePath(outputPath);

            if (!(await folderExists(resolvedOutputPath))) {
                await createDirectory(resolvedOutputPath);
            }

            for (const baseSize of imageBaseSizes) {
                let fileName = outputImagePrefix;
                if (includeSizeInFileName) {
                    fileName += baseSize;
                }

                const scalesToUse = excludedSizes.includes(baseSize) ? [1] : imageScales;

                for (const scale of scalesToUse) {
                    const outputFileName = scale === 1 ? `${fileName}.png` : `${fileName}@${scale}x.png`;
                    const outputFilePath = path.join(resolvedOutputPath, outputFileName);

                    const buffer = await this.convert(baseSize * scale);
                    await sharp(buffer).toFile(outputFilePath);
                    console.log(`Generated image: ${outputFilePath}`);
                }
            }
        } catch (err: any) {
            console.error(`Error generating image set: ${err.message}`);
            throw err;
        }
    }

    public async generateIosImageSet(outputPath: string, overlayPath?: string): Promise<void> {
        try {
            const resolvedOutputPath = await resolveAndValidatePath(outputPath);

            if (!(await folderExists(resolvedOutputPath))) {
                await createDirectory(resolvedOutputPath);
            }

            for (const item of this.config.ios.iosImageSizes) {
                const { size, scale } = item;
                const fileName = size === 1024
                    ? 'MarketingIcon1024.png'
                    : `Icon-${size}@${scale}x.png`;

                const outputFilePath = path.join(resolvedOutputPath, fileName);

                const buffer = await this.convert(size * scale, '#ffffff', overlayPath);
                await sharp(buffer).toFile(outputFilePath);
                console.log(`Generated iOS image: ${outputFilePath}`);
            }
        } catch (err: any) {
            console.error(`Error generating iOS image set: ${err.message}`);
            throw err;
        }
    }

    public async generateAndroidImageSet(
        outputPath: string,
        splashscreenImageName = 'splashscreen_image.png'
    ): Promise<void> {
        try {
            const resolvedOutputPath = await resolveAndValidatePath(outputPath);

            if (!(await folderExists(resolvedOutputPath))) {
                await createDirectory(resolvedOutputPath);
            }

            for (const [folder, size] of Object.entries(this.config.android.androidSizes)) {
                const folderPath = path.join(resolvedOutputPath, folder);
                const resolvedFolderPath = await resolveAndValidatePath(folderPath);

                if (!(await folderExists(resolvedFolderPath))) {
                    await createDirectory(resolvedFolderPath);
                }

                const outputFilePath = path.join(resolvedFolderPath, splashscreenImageName);

                const buffer = await this.convert(size);
                await sharp(buffer).toFile(outputFilePath);
                console.log(`Generated Android image: ${outputFilePath}`);
            }
        } catch (err: any) {
            console.error(`Error generating Android image set: ${err.message}`);
            throw err;
        }
    }
}
