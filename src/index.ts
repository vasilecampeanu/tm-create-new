#!/usr/bin/env node

import path from "path";
import { readConfig } from "./tm-create-new/utils/ConfigManager";
import { IConfig } from "./typings/IConfig";
import { prepareTargetReactNative, updateTargetReactNative } from "./tm-create-new/targets/PrepareTarget.ReactNative";

// Command-line argument parser
const args = process.argv.slice(2);
const isUpdateClient = args.includes('--update-client');

(async () => {
    const config: IConfig = await readConfig(path.join(path.dirname(__dirname), 'config.json'));

    if (isUpdateClient) {
        await updateTargetReactNative(config);
    } else {
        await prepareTargetReactNative(config);
    }
})();
