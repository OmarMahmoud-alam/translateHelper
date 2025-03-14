import * as fs from 'fs';
import * as path from 'path';

export async function extractStringsFromFolder(folderPath: string): Promise<string[]> {
    const files = fs.readdirSync(folderPath);
    let strings: string[] = [];
  
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        strings = strings.concat(await extractStringsFromFolder(filePath));
      } else if (file.endsWith('.dart')) {
        const fileStrings = extractStringsFromFile(filePath);
        strings = strings.concat(fileStrings);
      }
    }
  
    return strings;
  }
  
  export function extractStringsFromFile(filePath: string): string[] {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    let strings: string[] = [];
  
    for (const line of lines) {
      if (line.startsWith('import')) {
        continue;
      }
      const lineStrings = [
        ...(line.match(/"([^"]*)"/g) || []).map(str => str.replace(/"/g, '')),
        ...(line.match(/'([^']*)'/g) || []).map(str => str.replace(/'/g, ''))
      ];
      strings = strings.concat(lineStrings);
    }
  
    return strings;
  }
  export function generateTranslations(strings: string[]): { [key: string]: string } {
    const translations: { [key: string]: string } = {};
  
    strings.forEach(str => {
      const key = str.replace(/\s+/g, '').toLowerCase();
      translations[key] = str;
    });
  
    return translations;
  }
  
  export function saveTranslations(newTranslations: { [key: string]: string }, filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  
    let existingTranslations = {};
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingTranslations = JSON.parse(fileContent);
    }
    
    
  
    // Creating final translations object to ensure new keys are at the end
    const finalTranslations = { ...existingTranslations, ...newTranslations };
  
    fs.writeFileSync(filePath, JSON.stringify(finalTranslations, null, 2), 'utf8');
  }
  export function replaceStringsInFiles(folderPath: string, translations: { [key: string]: string }) {
    const files = fs.readdirSync(folderPath);
  
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        replaceStringsInFiles(filePath, translations);
      } else if (file.endsWith('.dart')) {
        let fileContent = fs.readFileSync(filePath, 'utf8');
  
        for (const [key, value] of Object.entries(translations)) {
          const regex = new RegExp(`(["'])${value}(["'])`, 'g');
          const replacement = `LocaleKeys.${key}.tr()`;
          fileContent = fileContent.replace(regex, replacement);
        }
  
        fs.writeFileSync(filePath, fileContent, 'utf8');
      }
    }
  }







  