import { promises as fs } from 'fs';
import path from 'path';
import { IConfig } from '../../typings/IConfig';
import { ImageRenderer } from '../renderer/ImageRenderer';
import { copyFile, createDirectory, folderExists, updateFile } from '../utils/FileUtils';

const createSplashContentsJson = async (config: IConfig, folderPath: string): Promise<void> => {
    const content = {
        "images": [
            {
                "filename": `${config.clientName}SplashScreenImage.png`,
                "idiom": "universal",
                "scale": "1x"
            },
            {
                "filename": `${config.clientName}SplashScreenImage@2x.png`,
                "idiom": "universal",
                "scale": "2x"
            },
            {
                "filename": `${config.clientName}SplashScreenImage@3x.png`,
                "idiom": "universal",
                "scale": "3x"
            }
        ],
        "info": {
            "author": "xcode",
            "version": 1
        }
    };

    const contentPath = path.join(folderPath, 'Contents.json');
    await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
};

export const prepareTargetIOS = async (config: IConfig): Promise<void> => {
    try {
        const targetPath = path.join(config.ios.targetConfigsPath, config.clientName);

        // Check if client already exists
        const clientExists = await folderExists(targetPath);
        if (clientExists) {
            throw new Error(`Client "${config.clientName}" already exists at ${targetPath}.`);
        }

        console.log(`Creating target directory at ${targetPath}`);
        await createDirectory(targetPath);

        // Copy template files
        const assetsBasePath = path.join(path.dirname(__dirname), "assets", "ios", "TargetTemplate");

        const filesToCopy = [
            { src: "AppCenter-Config.plist", dest: "AppCenter-Config.plist" },
            { src: "iTunesArtwork", dest: "iTunesArtwork" },
            { src: "iTunesArtwork@2x", dest: "iTunesArtwork@2x" },
            { src: "NextApp-Info.plist", dest: `${config.clientName}-Info.plist` },
            { src: "NextAppLaunchScreen.storyboard", dest: `${config.clientName}LaunchScreen.storyboard` },
        ];

        console.log("Copying template files:");
        for (const file of filesToCopy) {
            console.log(`Copying ${file.src} to ${file.dest}`);
            await copyFile(path.join(assetsBasePath, file.src), path.join(targetPath, file.dest));
        }

        const xcassetsPath = path.join(targetPath, `${config.clientName}Images.xcassets`);
        console.log(`Creating xcassets directory at ${xcassetsPath}`);
        await createDirectory(xcassetsPath);

        // Copy xcassets Contents.json
        console.log(`Copying xCassetsContents.json to ${xcassetsPath}`);
        await copyFile(path.join(assetsBasePath, "xCassetsContents.json"), path.join(xcassetsPath, "Contents.json"));

        const appIconsPaths = [
            { name: `${config.clientName}AppIcons.appiconset`, overlay: undefined },
            { name: `${config.clientName}AppIconsAlpha.appiconset`, overlay: "aoverlay.png" },
            { name: `${config.clientName}AppIconsBeta.appiconset`, overlay: "boverlay.png" },
        ];

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(`Creating app icons directory at ${appIconsPath}`);
            await createDirectory(appIconsPath);
            console.log(`Copying AppIconsContents.json to ${appIconsPath}`);
            await copyFile(path.join(assetsBasePath, "AppIconsContents.json"), path.join(appIconsPath, "Contents.json"));
        }

        const splashScreenImagePath = path.join(xcassetsPath, `${config.clientName}SplashScreenImage.imageset`);
        console.log(`Creating splash screen imageset at ${splashScreenImagePath}`);
        await createDirectory(splashScreenImagePath);
        console.log(`Creating Contents.json for splash screen imageset`);
        await createSplashContentsJson(config, splashScreenImagePath);

        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');

        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log("Generating iOS image assets for the new client:");

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(`Generating iOS image set for ${appIcons.name}`);
            await imageRenderer.generateIosImageSet(
                appIconsPath,
                appIcons.overlay ? path.join(path.dirname(__dirname), "assets", appIcons.overlay) : undefined
            );
        }

        console.log(`Generating splash screen image set`);
        await imageRenderer.generateImageSet(
            splashScreenImagePath,
            config.ios.splashScreenBaseImageSizes,
            config.ios.splashScreenScales,
            [],
            `${config.clientName}SplashScreenImage`,
            false
        );

    } catch (err: any) {
        console.error(`Error in prepareTargetIOS: ${err.message}`);
        throw err;
    }
};

export const updateTargetIOS = async (config: IConfig): Promise<void> => {
    try {
        const targetPath = path.join(config.ios.targetConfigsPath, config.clientName);

        // Ensure the client directory exists
        const clientExists = await folderExists(targetPath);
        if (!clientExists) {
            throw new Error(`Client "${config.clientName}" does not exist.`);
        }

        console.log(`Updating iOS target for client "${config.clientName}" at ${targetPath}`);

        const xcassetsPath = path.join(targetPath, `${config.clientName}Images.xcassets`);

        // Update xcassets Contents.json
        console.log(`Updating Contents.json in xcassets directory at ${xcassetsPath}`);
        await updateFile(
            path.join(path.dirname(__dirname), "assets", "ios", "TargetTemplate", "xCassetsContents.json"),
            path.join(xcassetsPath, "Contents.json")
        );

        const appIconsPaths = [
            { name: `${config.clientName}AppIcons.appiconset`, overlay: undefined },
            { name: `${config.clientName}AppIconsAlpha.appiconset`, overlay: "aoverlay.png" },
            { name: `${config.clientName}AppIconsBeta.appiconset`, overlay: "boverlay.png" },
        ];

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(`Updating Contents.json in ${appIcons.name}`);
            await updateFile(
                path.join(path.dirname(__dirname), "assets", "ios", "TargetTemplate", "AppIconsContents.json"),
                path.join(appIconsPath, "Contents.json")
            );
        }

        const splashScreenImagePath = path.join(xcassetsPath, `${config.clientName}SplashScreenImage.imageset`);

        // Recreate splash contents json
        console.log(`Updating Contents.json for splash screen imageset at ${splashScreenImagePath}`);
        await createSplashContentsJson(config, splashScreenImagePath);

        // Regenerate image sets
        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log("Updating iOS image assets for the existing client:");

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(`Regenerating iOS image set for ${appIcons.name}`);
            await imageRenderer.generateIosImageSet(
                appIconsPath,
                appIcons.overlay ? path.join(path.dirname(__dirname), 'assets', appIcons.overlay) : undefined
            );
        }

        console.log(`Regenerating splash screen image set`);
        await imageRenderer.generateImageSet(
            splashScreenImagePath,
            config.ios.splashScreenBaseImageSizes,
            config.ios.splashScreenScales,
            [],
            `${config.clientName}SplashScreenImage`,
            false
        );

    } catch (err: any) {
        console.error(`Error in updateTargetIOS: ${err.message}`);
        throw err;
    }
};
