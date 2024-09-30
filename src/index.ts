#!/usr/bin/env node

import path from "path";
import { prepareTargetAndroid } from "./tm-create-new/targets/PrepareTarget.Android";
import { prepareTargetIOS } from "./tm-create-new/targets/PrepareTarget.IOS";
import { prepareTargetReactNative, updateTargetReactNative } from "./tm-create-new/targets/PrepareTarget.ReactNative";
import { readConfig } from "./tm-create-new/utils/ConfigManager";
import { IConfig } from "./typings/IConfig";

// Command-line argument parser
const args = process.argv.slice(2);
const isUpdateClient = args.includes('--update-client');

(async () => {
    const config: IConfig = await readConfig(path.join(path.dirname(__dirname), 'config.json'));

    console.log(isUpdateClient ? `Updating existing client: ${config.clientName}` : `Creating new client: ${config.clientName}`);

    try {
        if (isUpdateClient) {
            await updateTargetReactNative (config);
        } else {
            console.log("\nPrepare configurations for the react-native target:");
            await prepareTargetReactNative(config);

            console.log("\nPrepare configurations for the android target:");
            await prepareTargetAndroid(config);

            console.log("\nPrepare configurations for the IOS target:");
            await prepareTargetIOS(config);
        }

        console.log('\x1b[32m%s\x1b[0m', '\nOperation completed successfully. ✅');

    } catch (err: any) {
        console.error(`An error occurred: ${err.message}`);
        process.exit(1);
    }
})();
