# i18n Translation Validator
A TypeScript utility for validating completeness of i18next translation files across different languages.

## Purpose
This script helps maintain consistency across translation files by:
- Detecting missing translation keys in language files
- Supporting nested translation structures
- Allowing specific keys to be ignored
- Providing clear, colorized console output
- Supporting CI/CD integration through exit codes

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Install required dependencies:
```bash
npm install chalk @types/node typescript ts-node
```

2. Create the following configuration files in your project root:

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "module": "ES2020",
    "moduleResolution": "node",
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "dist"
  },
  "ts-node": {
    "esm": true,
    "experimentalSpecifiers": true
  }
}
```

**package.json**:
```json
{
  "name": "i18n-validator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "validate": "node --loader ts-node/esm validator.ts"
  }
}
```

## Usage

### Basic Usage
```bash
npm run validate -- <base-file> <compare-directory> [ignored-keys...]
```

### Parameters
- `base-file`: Path to the reference translation file (usually English)
- `compare-directory`: Directory containing other language files to compare
- `ignored-keys`: (Optional) List of key prefixes to ignore during comparison

### Examples
```bash
# Compare all files against English
npm run validate -- ./locales/en/common.json ./locales

# Ignore specific sections
npm run validate -- ./locales/en/common.json ./locales metadata settings
```

## Implementation Details

### Key Components

1. **File Reading (`readJsonFile`):**
   - Asynchronously reads JSON files
   - Handles UTF-8 encoding
   - Includes error handling for file operations

2. **Object Flattening (`flattenObject`):**
   - Converts nested JSON structures into flat key paths
   - Example transformation:
     ```json
     {
       "header": {
         "title": "Hello",
         "subtitle": "World"
       }
     }
     ```
     Becomes:
     ```javascript
     [
       "header.title",
       "header.subtitle"
     ]
     ```

3. **Key Comparison (`findMissingKeys`):**
   - Identifies keys present in base file but missing in comparison files
   - Supports exact matching of full key paths

4. **Validation Logic (`validateTranslations`):**
   - Processes all JSON files in target directory
   - Filters out base file from comparison
   - Supports key ignoring through prefix matching

### Types

```typescript
interface TranslationDiff {
  missingKeys: string[];  // List of missing translation keys
  file: string;          // Filename with missing translations
}

type NestedObject = {
  [key: string]: string | NestedObject;  // Recursive type for nested JSON
};
```

## Exit Codes
- 0: Success (all translations complete)
- 1: Missing translations found or error occurred

## Console Output
The script provides colored console output:
- 🔵 Blue: Process information
- ⚫ Gray: File paths and details
- 🟢 Green: Success messages
- 🟡 Yellow: Warning headers
- 🔴 Red: Error messages and file names with missing translations

## Best Practices

1. **File Organization:**
   - Keep all translation files in a dedicated `/locales` directory
   - Use consistent naming across language files
   - Maintain parallel structure across all language files

2. **Key Management:**
   - Use descriptive, hierarchical keys
   - Follow consistent naming conventions
   - Document any ignored keys

3. **CI/CD Integration:**
   ```yaml
   # Example GitHub Actions step
   - name: Validate Translations
     run: npm run validate -- ./locales/en/common.json ./locales
     continue-on-error: false  # Fail pipeline on missing translations
   ```

## Troubleshooting

### Common Issues

1. **Module Import Errors:**
   ```
   Error: Cannot use import statement outside a module
   ```
   Solution: Ensure `"type": "module"` is in package.json

2. **TypeScript Recognition:**
   ```
   Unknown file extension ".ts"
   ```
   Solution: Use `--loader ts-node/esm` flag with node

3. **File Reading Errors:**
   ```
   Error reading file: ENOENT
   ```
   Solution: Verify file paths and permissions

## Contributing
When contributing to this validator:
1. Add tests for new features
2. Update documentation for any changes
3. Follow existing code style
4. Test against various file structures

## Future Improvements
- Add support for warning on extra keys in translation files
- Implement reporting in different formats (JSON, CSV)
- Add support for custom key matching rules
- Create interactive mode for fixing missing translations