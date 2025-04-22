import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import { IConfig } from '../../typings/IConfig';
import { ImageRenderer } from '../renderer/ImageRenderer';
import { copyFile, copyFolder, folderExists, updateFile } from '../utils/FileUtils';

const updateEnvFile = async (config: IConfig, envFilePath: string): Promise<void> => {
    try {
        let content = await fs.readFile(envFilePath, 'utf8');
        const envConfigEntries = Object.entries(config.env);

        for (const line of content.split('\n')) {
            const [key] = line.split('=');
            const correspondingEntry = envConfigEntries.find(([configKey]) => configKey === key);

            if (correspondingEntry) {
                const [, value] = correspondingEntry;
                content = content.replace(line, `${key}="${value}"`);
            }
        }

        await fs.writeFile(envFilePath, content, 'utf8');

        console.log(
            chalk.green(`✔ Updated .env file at: ${envFilePath} with the following configuration:\n${content}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`An error occurred while updating the env file: ${err.message}`));
        throw err;
    }
};

export const prepareTargetReactNative = async (config: IConfig): Promise<void> => {
    try {
        const templateSourcePath = path.join(config.react.targetConfigsPath, '__template__');

        const clientDestinationPath = path.join(
            config.react.targetConfigsPath,
            config.clientName.toLowerCase()
        );

        // Check if client already exists
        const clientExists = await folderExists(clientDestinationPath);

        if (clientExists) {
            throw new Error(
                `Client "${config.clientName}" already exists at ${clientDestinationPath}.`
            );
        }

        console.log(chalk.greenBright(`\n=== Preparing React Native target for ${config.clientName} ===`));

        // Copy the template folder securely
        console.log(chalk.blue(`\nCopying template folder to ${clientDestinationPath}`));
        await copyFolder(templateSourcePath, clientDestinationPath);

        // Update .env file variables
        const envFilePath = path.join(clientDestinationPath, '.env');
        console.log(chalk.blue(`\nUpdating .env file at ${envFilePath}`));
        await updateEnvFile(config, envFilePath);

        // Copy logo_image.svg securely
        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');
        const fileDestinationPath = path.join(
            clientDestinationPath,
            config.react.imagesPath,
            'logo_image.svg'
        );

        console.log(chalk.blue(`\nCopying logo_image.svg to ${fileDestinationPath}`));
        await copyFile(svgPath, fileDestinationPath);

        // Generate image set for React client
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log(chalk.greenBright('\n=== Generating React Native image assets ==='));

        await imageRenderer.generateImageSet(
            path.join(clientDestinationPath, config.react.imagesPath),
            config.react.imageBaseSizes,
            config.react.imageScales,
            config.react.excludedFromScaling
        );

        console.log(
            chalk.bgGreen.black(`\n✔ React Native target prepared successfully for ${config.clientName}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error in prepareTargetReactNative: ${err.message}`));
        throw err;
    }
};

export const updateTargetReactNative = async (config: IConfig): Promise<void> => {
    try {
        const clientDestinationPath = path.join(
            config.react.targetConfigsPath,
            config.clientName.toLowerCase()
        );

        // Ensure the client directory exists
        const clientExists = await folderExists(clientDestinationPath);

        if (!clientExists) {
            throw new Error(`Client "${config.clientName}" does not exist.`);
        }

        console.log(chalk.greenBright(`\n=== Updating React Native image assets for ${config.clientName} ===`));

        // Update logo_image.svg
        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');
        const fileDestinationPath = path.join(
            clientDestinationPath,
            config.react.imagesPath,
            'logo_image.svg'
        );
        await updateFile(svgPath, fileDestinationPath);

        // Regenerate image set for the existing client
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        await imageRenderer.generateImageSet(
            path.join(clientDestinationPath, config.react.imagesPath),
            config.react.imageBaseSizes,
            config.react.imageScales,
            config.react.excludedFromScaling
        );

        console.log(
            chalk.bgGreen.black(`\n✔ React Native image assets updated successfully for ${config.clientName}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error in updateTargetReactNative: ${err.message}`));
        throw err;
    }
};