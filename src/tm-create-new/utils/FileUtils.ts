import { promises as fs } from 'fs';
import path from 'path';

const BASE_DIR = '/Users/vasilecampeanu/Work/Projects/NextApp';

// Utility function to resolve and validate paths
const resolveAndValidatePath = async (inputPath: string): Promise<string> => {
    const resolvedPath = path.resolve(BASE_DIR, inputPath);

    if (!resolvedPath.startsWith(BASE_DIR + path.sep)) {
        throw new Error('Access denied: Path traversal detected');
    }

    return resolvedPath;
};

// Function to check if a folder exists securely
export const folderExists = async (dirPath: string): Promise<boolean> => {
    try {
        const resolvedPath = await resolveAndValidatePath(dirPath);
        const stats = await fs.lstat(resolvedPath);
        return stats.isDirectory();
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return false;
        } else {
            console.error(`Error checking folder existence: ${err.message}`);
            throw err;
        }
    }
};

// Function to create a directory securely
export const createDirectory = async (dirPath: string): Promise<void> => {
    try {
        const resolvedPath = await resolveAndValidatePath(dirPath);
        await fs.mkdir(resolvedPath, { recursive: true, mode: 0o700 });
    } catch (err: any) {
        console.error(`Error creating directory: ${err.message}`);
        throw err;
    }
};

// Function to copy a folder securely
export const copyFolder = async (src: string, dest: string): Promise<void> => {
    try {
        const srcPath  = await resolveAndValidatePath(src);
        const destPath = await resolveAndValidatePath(dest);
        const srcStats = await fs.lstat(srcPath);

        if (!srcStats.isDirectory()) {
            throw new Error('Source is not a directory');
        }

        await fs.cp(srcPath, destPath, {
            recursive: true,
            errorOnExist: false,
            force: true,
            preserveTimestamps: true,
            verbatimSymlinks: false,
        });
    } catch (err: any) {
        console.error(`Error copying folder: ${err.message}`);
        throw err;
    }
};

// Function to copy a file securely
export const copyFile = async (src: string, dest: string): Promise<void> => {
    try {
        const srcPath  = await resolveAndValidatePath(src);
        const destPath = await resolveAndValidatePath(dest);
        const srcStats = await fs.lstat(srcPath);

        if (!srcStats.isFile()) {
            throw new Error('Source is not a file');
        }

        await fs.mkdir(path.dirname(destPath), { recursive: true, mode: 0o700 });
        await fs.copyFile(srcPath, destPath, fs.constants.COPYFILE_EXCL);
    } catch (err: any) {
        console.error(`Error copying file: ${err.message}`);
        throw err;
    }
};

// Function to rename a folder securely
export const renameFolder = async (oldDirPath: string, newDirPath: string): Promise<void> => {
    try {
        const oldPath  = await resolveAndValidatePath(oldDirPath);
        const newPath  = await resolveAndValidatePath(newDirPath);
        const oldStats = await fs.lstat(oldPath);

        if (!oldStats.isDirectory()) {
            throw new Error('Old path is not a directory');
        }

        await fs.rename(oldPath, newPath);
    } catch (err: any) {
        console.error(`Error renaming folder: ${err.message}`);
        throw err;
    }
};

// Function to rename a file securely
export const renameFile = async (oldFilePath: string, newFilePath: string): Promise<void> => {
    try {
        const oldPath  = await resolveAndValidatePath(oldFilePath);
        const newPath  = await resolveAndValidatePath(newFilePath);
        const oldStats = await fs.lstat(oldPath);

        if (!oldStats.isFile()) {
            throw new Error('Old path is not a file');
        }

        await fs.mkdir(path.dirname(newPath), { recursive: true, mode: 0o700 });
        await fs.rename(oldPath, newPath);
    } catch (err: any) {
        console.error(`Error renaming file: ${err.message}`);
        throw err;
    }
};
