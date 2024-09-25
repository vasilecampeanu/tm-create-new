export interface IConfig {
    clientName: string;
    env: {
        APP_DISPLAY_NAME: string;
        APP_VERSION: string;
        BASE_URL: string;
        AUTH_ID: string;
    };
    app_secret_android: string,
    app_secret_ios: string,
    react: {
        targetConfigsPath: string;
        imagesPath: string;
        imageBaseSizes: number[];
        imageScales: number[];
        excludedFromScaling: number[];
    };
    android: {
        targetConfigsPath: string,
        androidSizes: {
            'drawable-mdpi': number;
            'drawable-hdpi': number;
            'drawable-xhdpi': number;
            'drawable-xxhdpi': number;
            'drawable-xxxhdpi': number;
        };
    };
    ios: {
        targetConfigsPath: string;
        splashScreenBaseImageSizes: number[];
        splashScreenScales: number[];
        iosImageSizes: { size: number, scale: number }[];
    };
}
