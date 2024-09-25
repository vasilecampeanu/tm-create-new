import { promises as fs } from 'fs';
import path from 'path'
import { IConfig } from '../../typings/IConfig';
import { copyFile, copyFolder } from '../utils/FileUtils';
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
    const templateSourcePath = path.join(config.react.targetConfigsPath, "__template__");
    const clientDestinationPath = path.join(config.react.targetConfigsPath, config.clientName.toLocaleLowerCase());

    // Duplicate __template__ folder and rename it to client name.
    await copyFolder(templateSourcePath, clientDestinationPath);

    // Update .env file variables.
    const envFilePath = path.join(clientDestinationPath, '.env');
    await updateEnvFile(config, envFilePath);

    // Copy of logo_image.svg
    const svgPath = path.join(`${path.dirname(__dirname)}`, 'logo_image.svg');
    const fileDestinationPath = path.join(config.react.targetConfigsPath, config.clientName.toLocaleLowerCase(), config.react.imagesPath, 'logo_image.svg');
    await copyFile(svgPath, fileDestinationPath);

    // Generate image set fro react client
    ImageRenderer.create(config, svgPath).then(imageRenderer => {
        imageRenderer.generateImageSet(
            path.join(config.react.targetConfigsPath, config.clientName.toLocaleLowerCase(), config.react.imagesPath),
            config.react.imageBaseSizes,
            config.react.imageScales,
            config.react.excludedFromScaling
        );
    }).catch(err => {
        console.error(err);
    });
}
