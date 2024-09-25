import { promises as fs } from 'fs';
import { IConfig } from '../../typings/IConfig';

export const readConfig = async (configPath: string): Promise<IConfig> => {
    try {
        const configData = await fs.readFile(configPath);
        return JSON.parse(configData.toString()) as IConfig;
    } catch (err) {
        throw new Error(`Could not read config file at path: ${configPath}`);
    }
};
