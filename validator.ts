import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

interface TranslationDiff {
  missingKeys: string[];
  file: string;
}

type NestedObject = {
  [key: string]: string | NestedObject;
};

async function readJsonFile(filePath: string): Promise<NestedObject> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Error reading file ${filePath}: ${error.message}`);
  }
}

function flattenObject(obj: NestedObject, prefix = ''): string[] {
  return Object.entries(obj).reduce((acc: string[], [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return [...acc, ...flattenObject(value, newKey)];
    }
    return [...acc, newKey];
  }, []);
}

function findMissingKeys(baseKeys: string[], compareKeys: string[]): string[] {
  return baseKeys.filter(key => !compareKeys.includes(key));
}

async function validateTranslations(
  baseFilePath: string,
  compareDirectory: string,
  ignoredKeys: string[] = []
): Promise<TranslationDiff[]> {
  try {
    // Read and parse the base file
    const baseObj = await readJsonFile(baseFilePath);
    const baseKeys = flattenObject(baseObj).filter(
      key => !ignoredKeys.some(ignored => key.startsWith(ignored))
    );

    console.log(chalk.gray(`Found ${baseKeys.length} keys in the base file`));

    console.log(chalk.gray(`Found ${compareDirectory}`));
    // Get all JSON files in the compare directory
    const files = await fs.readdir(compareDirectory);
    const jsonFiles = files.filter(
      file => 
        path.extname(file) === '.json' && 
        path.resolve(compareDirectory, file) !== path.resolve(baseFilePath)
    );

    console.log(chalk.gray(`Found ${jsonFiles.length} files to validate`));

    // Check each file against the base file
    const results: TranslationDiff[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(compareDirectory, file);
      const compareObj = await readJsonFile(filePath);
      const compareKeys = flattenObject(compareObj);
      
      const missingKeys = findMissingKeys(baseKeys, compareKeys);
      
      if (missingKeys.length > 0) {
        results.push({
          file,
          missingKeys,
        });
      }
    }

    return results;
  } catch (error: any) {
    throw new Error(`Validation failed: ${error.message}`);
  }
}

async function main() {
  try {
    const baseFile = process.argv[2];
    const compareDir = process.argv[3];
    const ignoredKeys = process.argv.slice(4);

    if (!baseFile || !compareDir) {
      throw new Error(
        'Usage: ts-node validator.ts <base-file> <compare-directory> [ignored-keys...]'
      );
    }

    console.log(chalk.blue('Starting translation validation...'));
    console.log(chalk.gray(`Base file: ${baseFile}`));
    console.log(chalk.gray(`Compare directory: ${compareDir}`));
    
    if (ignoredKeys.length > 0) {
      console.log(chalk.gray(`Ignored keys: ${ignoredKeys.join(', ')}`));
    }

    const differences = await validateTranslations(baseFile, compareDir, ignoredKeys);

    if (differences.length === 0) {
      console.log(chalk.green('\n✓ All translation files are complete!'));
      return;
    }

    console.log(chalk.yellow('\nMissing translations found:'));
    differences.forEach(({ file, missingKeys }) => {
      console.log(chalk.red(`\n${file}:`));
      missingKeys.forEach(key => {
        console.log(chalk.gray(`  - ${key}`));
      });
    });

    process.exit(1);
  } catch (error: any) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

// Run the validator
(async () => {
  await main();
})();
