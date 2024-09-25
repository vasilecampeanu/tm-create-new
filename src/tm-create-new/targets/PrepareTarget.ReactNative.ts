import { promises as fs } from 'fs';
import path from 'path'
import { IConfig } from '../../typings/IConfig';
import { copyFile, copyFolder, folderExists, updateFile } from '../utils/FileUtils';
import { ImageRenderer } from '../renderer/ImageRenderer';

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
    } catch (err) {
        console.error(`An error occurred while updating the env file. Error: ${err}`);
    }
}

export const prepareTargetReactNative = async (config: IConfig): Promise<void> => {
    try {
        const templateSourcePath = path.join(config.react.targetConfigsPath, '__template__');
        const clientDestinationPath = path.join(
            config.react.targetConfigsPath,
            config.clientName.toLowerCase()
        );

        // Copy the template folder securely
        await copyFolder(templateSourcePath, clientDestinationPath);

        // Update .env file variables
        const envFilePath = path.join(clientDestinationPath, '.env');
        await updateEnvFile(config, envFilePath);

        // Copy logo_image.svg securely
        const svgPath = path.join(path.dirname(__dirname), 'assets', 'logo_image.svg');
        const fileDestinationPath = path.join(
            clientDestinationPath,
            config.react.imagesPath,
            'logo_image.svg'
        );
        await copyFile(svgPath, fileDestinationPath);

        // Generate image set for React client
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        await imageRenderer.generateImageSet(
            path.join(clientDestinationPath, config.react.imagesPath),
            config.react.imageBaseSizes,
            config.react.imageScales,
            config.react.excludedFromScaling
        );
    } catch (err: any) {
        console.error(`Error preparing React Native target: ${err.message}`);
        throw err;
    }
};

// New function to update images for an existing client
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

        console.log(`Images for client "${config.clientName}" have been updated.`);
    } catch (err: any) {
        console.error(`Error updating React Native target: ${err.message}`);
        throw err;
    }
};