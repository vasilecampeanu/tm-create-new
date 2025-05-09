import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";

// Utility function to resolve paths
export const resolveAndValidatePath = async (
    inputPath: string
): Promise<string> => {
    return path.resolve(inputPath);
};

// Function to check if a folder exists securely
export const folderExists = async (dirPath: string): Promise<boolean> => {
    try {
        const resolvedPath = await resolveAndValidatePath(dirPath);
        const stats = await fs.lstat(resolvedPath);
        return stats.isDirectory();
    } catch (err: any) {
        if (err.code === "ENOENT") {
            return false;
        } else {
            console.error(
                chalk.red(`Error checking folder existence: ${err.message}`)
            );
            throw err;
        }
    }
};

// Function to create a directory securely
export const createDirectory = async (dirPath: string): Promise<void> => {
    try {
        const resolvedPath = await resolveAndValidatePath(dirPath);
        await fs.mkdir(resolvedPath, { recursive: true, mode: 0o700 });
        console.log(chalk.blue(`Created directory: ${resolvedPath}`));
    } catch (err: any) {
        console.error(chalk.red(`Error creating directory: ${err.message}`));
        throw err;
    }
};

// Function to copy a folder securely
export const copyFolder = async (src: string, dest: string): Promise<void> => {
    try {
        const srcPath = await resolveAndValidatePath(src);
        const destPath = await resolveAndValidatePath(dest);
        const srcStats = await fs.lstat(srcPath);

        if (!srcStats.isDirectory()) {
            throw new Error("Source is not a directory");
        }

        await fs.cp(srcPath, destPath, {
            recursive: true,
            errorOnExist: false,
            force: true,
            preserveTimestamps: true,
            verbatimSymlinks: false,
        });
        console.log(
            chalk.blue(`Copied folder: ${chalk.cyan(srcPath)} -> ${chalk.cyan(destPath)}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error copying folder: ${err.message}`));
        throw err;
    }
};

// Function to copy a file securely
export const copyFile = async (src: string, dest: string): Promise<void> => {
    try {
        const srcPath = await resolveAndValidatePath(src);
        const destPath = await resolveAndValidatePath(dest);
        const srcStats = await fs.lstat(srcPath);

        if (!srcStats.isFile()) {
            throw new Error("Source is not a file");
        }

        await fs.mkdir(path.dirname(destPath), {
            recursive: true,
            mode: 0o700,
        });
        await fs.copyFile(srcPath, destPath);
        console.log(
            chalk.blue(`Copied file: ${chalk.cyan(srcPath)} -> ${chalk.cyan(destPath)}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error copying file: ${err.message}`));
        throw err;
    }
};

// Function to update a file securely
export const updateFile = async (src: string, dest: string): Promise<void> => {
    try {
        const srcPath = await resolveAndValidatePath(src);
        const destPath = await resolveAndValidatePath(dest);
        const srcStats = await fs.lstat(srcPath);

        if (!srcStats.isFile()) {
            throw new Error("Source is not a file");
        }

        // Ensure the destination directory exists
        await fs.mkdir(path.dirname(destPath), {
            recursive: true,
            mode: 0o700,
        });

        // Read the content from the source file
        const content = await fs.readFile(srcPath, "utf8");

        // Write the content to the destination file (overwrite existing content)
        await fs.writeFile(destPath, content, "utf8");

        console.log(
            chalk.blue(`Updated file: ${chalk.cyan(srcPath)} -> ${chalk.cyan(destPath)}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error updating file: ${err.message}`));
        throw err;
    }
};

// Function to rename a folder securely
export const renameFolder = async (
    oldDirPath: string,
    newDirPath: string
): Promise<void> => {
    try {
        const oldPath = await resolveAndValidatePath(oldDirPath);
        const newPath = await resolveAndValidatePath(newDirPath);
        const oldStats = await fs.lstat(oldPath);

        if (!oldStats.isDirectory()) {
            throw new Error("Old path is not a directory");
        }

        await fs.rename(oldPath, newPath);
        console.log(
            chalk.blue(`Renamed folder: ${chalk.cyan(oldPath)} -> ${chalk.cyan(newPath)}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error renaming folder: ${err.message}`));
        throw err;
    }
};

// Function to rename a file securely
export const renameFile = async (
    oldFilePath: string,
    newFilePath: string
): Promise<void> => {
    try {
        const oldPath = await resolveAndValidatePath(oldFilePath);
        const newPath = await resolveAndValidatePath(newFilePath);
        const oldStats = await fs.lstat(oldPath);

        if (!oldStats.isFile()) {
            throw new Error("Old path is not a file");
        }

        await fs.mkdir(path.dirname(newPath), {
            recursive: true,
            mode: 0o700,
        });
        await fs.rename(oldPath, newPath);
        console.log(
            chalk.blue(`Renamed file: ${chalk.cyan(oldPath)} -> ${chalk.cyan(newPath)}`)
        );
    } catch (err: any) {
        console.error(chalk.red(`Error renaming file: ${err.message}`));
        throw err;
    }
};
