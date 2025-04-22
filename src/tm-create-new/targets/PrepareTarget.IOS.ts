import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import plist from 'plist';
import { IConfig } from '../../typings/IConfig';
import { ImageRenderer } from '../renderer/ImageRenderer';
import { copyFile, createDirectory, folderExists, updateFile } from '../utils/FileUtils';

const createSplashContentsJson = async (config: IConfig, folderPath: string): Promise<void> => {
    const content = {
        images: [
            {
                filename: `${config.clientName}SplashScreenImage.png`,
                idiom: 'universal',
                scale: '1x',
            },
            {
                filename: `${config.clientName}SplashScreenImage@2x.png`,
                idiom: 'universal',
                scale: '2x',
            },
            {
                filename: `${config.clientName}SplashScreenImage@3x.png`,
                idiom: 'universal',
                scale: '3x',
            },
        ],
        info: {
            author: 'xcode',
            version: 1,
        },
    };

    const contentPath = path.join(folderPath, 'Contents.json');
    await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
    console.log(chalk.green(`✔ Created Contents.json for splash screen at ${contentPath}`));
};

export const prepareTargetIOS = async (config: IConfig): Promise<void> => {
    try {
        const targetPath = path.join(config.ios.targetConfigsPath, config.clientName);

        // Check if client already exists
        const clientExists = await folderExists(targetPath);
        if (clientExists) {
            throw new Error(`Client "${config.clientName}" already exists at ${targetPath}.`);
        }

        console.log(chalk.greenBright(`\n=== Preparing iOS target for ${config.clientName} ===`));

        console.log(chalk.blue(`\nCreating target directory at ${targetPath}`));
        await createDirectory(targetPath);

        // Copy template files
        const assetsBasePath = path.join(path.dirname(__dirname), 'assets', 'ios', 'TargetTemplate');

        const filesToCopy = [
            { src: 'AppCenter-Config.plist', dest: 'AppCenter-Config.plist' },
            { src: 'NextApp-Info.plist', dest: `${config.clientName}-Info.plist` },
            { src: 'NextAppLaunchScreen.storyboard', dest: `${config.clientName}LaunchScreen.storyboard` },
        ];

        console.log(chalk.blue('\nCopying template files:'));
        for (const file of filesToCopy) {
            console.log(chalk.cyan(`- Copying ${file.src} to ${file.dest}`));
            await copyFile(path.join(assetsBasePath, file.src), path.join(targetPath, file.dest));
        }

        // Modify the -Info.plist file to set UILaunchStoryboardName
        const infoPlistPath = path.join(targetPath, `${config.clientName}-Info.plist`);
        const infoPlistContent = await fs.readFile(infoPlistPath, 'utf8');
        const infoPlistData = plist.parse(infoPlistContent) as any;

        // Modify the UILaunchStoryboardName
        infoPlistData.UILaunchStoryboardName = `${config.clientName}LaunchScreen`;

        // Write back the plist file
        const newInfoPlistContent = plist.build(infoPlistData);
        await fs.writeFile(infoPlistPath, newInfoPlistContent);
        console.log(chalk.green(`✔ Updated UILaunchStoryboardName in ${infoPlistPath}`));

        // Modify the LaunchScreen.storyboard file to replace image names
        const launchScreenStoryboardPath = path.join(targetPath, `${config.clientName}LaunchScreen.storyboard`);
        let launchScreenContent = await fs.readFile(launchScreenStoryboardPath, 'utf8');
        const oldImageName = 'NextAppSplashScreenImage';
        const newImageName = `${config.clientName}SplashScreenImage`;

        // Replace all occurrences of the old image name with the new image name
        const regex = new RegExp(oldImageName, 'g');
        launchScreenContent = launchScreenContent.replace(regex, newImageName);

        // Write back the modified storyboard file
        await fs.writeFile(launchScreenStoryboardPath, launchScreenContent);
        console.log(chalk.green(`✔ Updated image names in ${launchScreenStoryboardPath}`));

        const xcassetsPath = path.join(targetPath, `${config.clientName}Images.xcassets`);
        console.log(chalk.blue(`\nCreating xcassets directory at ${xcassetsPath}`));
        await createDirectory(xcassetsPath);

        // Copy xcassets Contents.json
        console.log(chalk.blue(`Copying xCassetsContents.json to ${xcassetsPath}`));
        await copyFile(
            path.join(assetsBasePath, 'xCassetsContents.json'),
            path.join(xcassetsPath, 'Contents.json')
        );

        const appIconsPaths = [
            { name: `${config.clientName}AppIcons.appiconset`, overlay: undefined },
            { name: `${config.clientName}AppIconsAlpha.appiconset`, overlay: 'aoverlay.png' },
            { name: `${config.clientName}AppIconsBeta.appiconset`, overlay: 'boverlay.png' },
        ];

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(chalk.blue(`\nCreating app icons directory at ${appIconsPath}`));
            await createDirectory(appIconsPath);
            console.log(chalk.blue(`Copying AppIconsContents.json to ${appIconsPath}`));
            await copyFile(
                path.join(assetsBasePath, 'AppIconsContents.json'),
                path.join(appIconsPath, 'Contents.json')
            );
        }

        const splashScreenImagePath = path.join(
            xcassetsPath,
            `${config.clientName}SplashScreenImage.imageset`
        );
        console.log(chalk.blue(`\nCreating splash screen imageset at ${splashScreenImagePath}`));
        await createDirectory(splashScreenImagePath);
        console.log(chalk.blue(`Creating Contents.json for splash screen imageset`));
        await createSplashContentsJson(config, splashScreenImagePath);

        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');

        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log(chalk.greenBright('\n=== Generating iOS image assets ==='));

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(chalk.green(`\nGenerating iOS image set for ${appIcons.name}`));
            await imageRenderer.generateIosImageSet(
                appIconsPath,
                appIcons.overlay
                    ? path.join(path.dirname(__dirname), 'assets', appIcons.overlay)
                    : undefined
            );
        }

        console.log(chalk.green(`\nGenerating splash screen image set`));
        await imageRenderer.generateImageSet(
            splashScreenImagePath,
            config.ios.splashScreenBaseImageSizes,
            config.ios.splashScreenScales,
            [],
            `${config.clientName}SplashScreenImage`,
            false
        );

        // Generate iTunesArtwork images using your ImageRenderer
        console.log(chalk.green(`\nGenerating iTunesArtwork images`));

        const iTunesArtworkPath = path.join(targetPath, 'iTunesArtwork');
        await imageRenderer.saveConvertedSVG(iTunesArtworkPath, 512, '#ffffff');

        const iTunesArtwork2xPath = path.join(targetPath, 'iTunesArtwork@2x');
        await imageRenderer.saveConvertedSVG(iTunesArtwork2xPath, 1024, '#ffffff');

        console.log(chalk.bgGreen.black(`\n✔ iOS target prepared successfully for ${config.clientName}`));
    } catch (err: any) {
        console.error(chalk.red(`Error in prepareTargetIOS: ${err.message}`));
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

        console.log(chalk.greenBright(`\n=== Updating iOS target for ${config.clientName} ===`));

        const xcassetsPath = path.join(targetPath, `${config.clientName}Images.xcassets`);

        // Update xcassets Contents.json
        console.log(chalk.blue(`\nUpdating Contents.json in xcassets directory at ${xcassetsPath}`));
        await updateFile(
            path.join(
                path.dirname(__dirname),
                'assets',
                'ios',
                'TargetTemplate',
                'xCassetsContents.json'
            ),
            path.join(xcassetsPath, 'Contents.json')
        );

        const appIconsPaths = [
            { name: `${config.clientName}AppIcons.appiconset`, overlay: undefined },
            { name: `${config.clientName}AppIconsAlpha.appiconset`, overlay: 'aoverlay.png' },
            { name: `${config.clientName}AppIconsBeta.appiconset`, overlay: 'boverlay.png' },
        ];

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(chalk.blue(`\nUpdating Contents.json in ${appIcons.name}`));
            await updateFile(
                path.join(
                    path.dirname(__dirname),
                    'assets',
                    'ios',
                    'TargetTemplate',
                    'AppIconsContents.json'
                ),
                path.join(appIconsPath, 'Contents.json')
            );
        }

        const splashScreenImagePath = path.join(
            xcassetsPath,
            `${config.clientName}SplashScreenImage.imageset`
        );

        // Recreate splash contents json
        console.log(
            chalk.blue(
                `\nUpdating Contents.json for splash screen imageset at ${splashScreenImagePath}`
            )
        );
        await createSplashContentsJson(config, splashScreenImagePath);

        // Modify the -Info.plist file to set UILaunchStoryboardName
        const infoPlistPath = path.join(targetPath, `${config.clientName}-Info.plist`);
        const infoPlistContent = await fs.readFile(infoPlistPath, 'utf8');
        const infoPlistData = plist.parse(infoPlistContent) as any;

        // Modify the UILaunchStoryboardName
        infoPlistData.UILaunchStoryboardName = `${config.clientName}LaunchScreen`;

        // Write back the plist file
        const newInfoPlistContent = plist.build(infoPlistData);
        await fs.writeFile(infoPlistPath, newInfoPlistContent);
        console.log(chalk.green(`✔ Updated UILaunchStoryboardName in ${infoPlistPath}`));

        // Modify the LaunchScreen.storyboard file to replace image names
        const launchScreenStoryboardPath = path.join(targetPath, `${config.clientName}LaunchScreen.storyboard`);
        let launchScreenContent = await fs.readFile(launchScreenStoryboardPath, 'utf8');
        const oldImageName = 'NextAppSplashScreenImage';
        const newImageName = `${config.clientName}SplashScreenImage`;

        // Replace all occurrences of the old image name with the new image name
        const regex = new RegExp(oldImageName, 'g');
        launchScreenContent = launchScreenContent.replace(regex, newImageName);

        // Write back the modified storyboard file
        await fs.writeFile(launchScreenStoryboardPath, launchScreenContent);
        console.log(chalk.green(`✔ Updated image names in ${launchScreenStoryboardPath}`));

        // Regenerate image sets
        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log(chalk.greenBright('\n=== Updating iOS image assets ==='));

        for (const appIcons of appIconsPaths) {
            const appIconsPath = path.join(xcassetsPath, appIcons.name);
            console.log(chalk.green(`\nRegenerating iOS image set for ${appIcons.name}`));
            await imageRenderer.generateIosImageSet(
                appIconsPath,
                appIcons.overlay
                    ? path.join(path.dirname(__dirname), 'assets', appIcons.overlay)
                    : undefined
            );
        }

        console.log(chalk.green(`\nRegenerating splash screen image set`));
        await imageRenderer.generateImageSet(
            splashScreenImagePath,
            config.ios.splashScreenBaseImageSizes,
            config.ios.splashScreenScales,
            [],
            `${config.clientName}SplashScreenImage`,
            false
        );

        // Regenerate iTunesArtwork images using your ImageRenderer
        console.log(chalk.green(`\nRegenerating iTunesArtwork images`));

        const iTunesArtworkPath = path.join(targetPath, 'iTunesArtwork');
        await imageRenderer.saveConvertedSVG(iTunesArtworkPath, 512, '#ffffff');

        const iTunesArtwork2xPath = path.join(targetPath, 'iTunesArtwork@2x');
        await imageRenderer.saveConvertedSVG(iTunesArtwork2xPath, 1024, '#ffffff');

        console.log(chalk.bgGreen.black(`\n✔ iOS target updated successfully for ${config.clientName}`));
    } catch (err: any) {
        console.error(chalk.red(`Error in updateTargetIOS: ${err.message}`));
        throw err;
    }
};
