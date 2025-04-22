import chalk from "chalk";
import { promises as fs } from "fs";
import { IConfig } from "../../typings/IConfig";

export const readConfig = async (configPath: string): Promise<IConfig> => {
    try {
        const configData = await fs.readFile(configPath);
        console.log(chalk.green(`Read configuration from: ${configPath}`));
        return JSON.parse(configData.toString()) as IConfig;
    } catch (err) {
        console.error(
            chalk.red(`Could not read config file at path: ${configPath}`)
        );
        throw new Error(`Could not read config file at path: ${configPath}`);
    }
};
