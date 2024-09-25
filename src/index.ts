#!/usr/bin/env node

import path from "path";
import { readConfig } from "./tm-create-new/utils/ConfigManager";
import { IConfig } from "./typings/IConfig";
import { prepareTargetReactNative } from "./tm-create-new/targets/PrepareTarget.ReactNative";

(async () => {
    const config: IConfig = await readConfig(path.join(path.dirname(__dirname), 'config.json'));

    // TODO:
    // Prepare configs for each target
    await prepareTargetReactNative(config);
})();
