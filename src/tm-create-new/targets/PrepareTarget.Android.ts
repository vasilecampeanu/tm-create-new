import chalk from "chalk";
import path from "path";
import { IConfig } from "../../typings/IConfig";
import { ImageRenderer } from "../renderer/ImageRenderer";
import { copyFolder, folderExists, updateFile } from "../utils/FileUtils";

// Helper function to prepare the Android target
export const prepareTargetAndroid = async (
    config: IConfig
): Promise<void> => {
    try {
        const svgPath = path.join(
            path.dirname(__dirname),
            "assets",
            "logo_image.svg"
        );
        const clientPath = path.join(
            config.android.targetConfigsPath,
            config.clientName
        );

        // Check if client already exists
        const clientExists = await folderExists(clientPath);

        if (clientExists) {
            throw new Error(
                `Client "${config.clientName}" already exists at ${clientPath}.`
            );
        }

        // Copy the template folder securely
        await copyFolder(
            path.join(config.android.targetConfigsPath, "NextApp"),
            clientPath
        );

        // Generate Android image set and save SVGs
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log(
            chalk.greenBright("\n=== Generating Android image assets ===")
        );

        await imageRenderer.generateAndroidImageSet(path.join(clientPath, "res"));
        await imageRenderer.saveConvertedSVG(
            path.join(clientPath, "ic_launcher-playstore.png"),
            512,
            "#ffffff"
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_2046_wbg.png"
            ),
            2046,
            "#ffffff"
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_512_wbg.png"
            ),
            512,
            "#ffffff"
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_aoverlay.png"
            ),
            512,
            undefined,
            path.join(path.dirname(__dirname), "assets", "aoverlay.png")
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_boverlay.png"
            ),
            512,
            undefined,
            path.join(path.dirname(__dirname), "assets", "boverlay.png")
        );
    } catch (err: any) {
        console.error(chalk.red(`Error in prepareTargetAndroid: ${err.message}`));
        throw err;
    }
};

// Helper function to update the Android target for an existing client
export const updateTargetAndroid = async (
    config: IConfig
): Promise<void> => {
    try {
        const clientPath = path.join(
            config.android.targetConfigsPath,
            config.clientName
        );

        // Ensure the client directory exists
        const clientExists = await folderExists(clientPath);
        if (!clientExists) {
            throw new Error(`Client "${config.clientName}" does not exist.`);
        }

        // Update logo_image.svg
        const svgPath = path.join(
            path.dirname(__dirname),
            "assets",
            "logo_image.svg"
        );
        const destinationPath = path.join(clientPath, "res", "logo_image.svg");
        await updateFile(svgPath, destinationPath);

        // Regenerate Android image set for the existing client
        const imageRenderer = await ImageRenderer.create(config, svgPath);

        console.log(
            chalk.greenBright("\n=== Updating Android image assets ===")
        );

        await imageRenderer.generateAndroidImageSet(path.join(clientPath, "res"));
        await imageRenderer.saveConvertedSVG(
            path.join(clientPath, "ic_launcher-playstore.png"),
            512,
            "#ffffff"
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_2046_wbg.png"
            ),
            2046,
            "#ffffff"
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_aoverlay.png"
            ),
            512,
            undefined,
            path.join(path.dirname(__dirname), "assets", "aoverlay.png")
        );
        await imageRenderer.saveConvertedSVG(
            path.join(
                "out",
                config.clientName.toLowerCase(),
                "logo_image_boverlay.png"
            ),
            512,
            undefined,
            path.join(path.dirname(__dirname), "assets", "boverlay.png")
        );
    } catch (err: any) {
        console.error(chalk.red(`Error in updateTargetAndroid: ${err.message}`));
        throw err;
    }
};
