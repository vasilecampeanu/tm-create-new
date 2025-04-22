#!/usr/bin/env node

import chalk from "chalk";
import path from "path";
import { prepareTargetAndroid, updateTargetAndroid } from "./tm-create-new/targets/PrepareTarget.Android";
import { prepareTargetIOS, updateTargetIOS } from "./tm-create-new/targets/PrepareTarget.IOS";
import {
    prepareTargetReactNative,
    updateTargetReactNative
} from "./tm-create-new/targets/PrepareTarget.ReactNative";
import { readConfig } from "./tm-create-new/utils/ConfigManager";
import { IConfig } from "./typings/IConfig";

// Command-line argument parser
const args = process.argv.slice(2);
const isUpdateClient = args.includes("--update-client");

(async () => {
    const config: IConfig = await readConfig(
        path.join(path.dirname(__dirname), "config.json")
    );

    console.log(
        isUpdateClient
            ? chalk.blueBright(`\nUpdating existing client: ${config.clientName}`)
            : chalk.blueBright(`\nCreating new client: ${config.clientName}`)
    );

    try {
        if (isUpdateClient) {
            await updateTargetReactNative(config);
            await updateTargetAndroid(config);
            await updateTargetIOS(config);
        } else {
            console.log(
                chalk.greenBright("\n=== Preparing React Native target ===")
            );
            await prepareTargetReactNative(config);

            console.log(chalk.greenBright("\n=== Preparing Android target ==="));
            await prepareTargetAndroid(config);

            console.log(chalk.greenBright("\n=== Preparing iOS target ==="));
            await prepareTargetIOS(config);
        }

        console.log(chalk.bgGreen.black("\nOperation completed successfully"));
    } catch (err: any) {
        console.error(chalk.bgRed.white(`An error occurred: ${err.message}`));
        process.exit(1);
    }
})();
