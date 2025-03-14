
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/*
export async function extractStringsFromFolder(folderPath: string, exceptions: any): Promise<string[]> {
  const files = fs.readdirSync(folderPath);
  let strings: string[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      strings = strings.concat(await extractStringsFromFolder(filePath, exceptions));
    } else if (file.endsWith('.dart')) {
      const fileStrings = extractStringsFromFile(filePath, exceptions);
      strings = strings.concat(fileStrings);
    }
  }

  return strings;
}
*/
export async function extractStringsFromFolder(folderPath: string, exceptions: any): Promise<string[]> {
  const files = fs.readdirSync(folderPath);
  let strings: string[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    // Check for folder name exceptions
    if (fs.lstatSync(filePath).isDirectory()) {
      const folderName = path.basename(filePath);
      const folderSegments = filePath.split(path.sep);
      const isException = folderSegments.some(segment => exceptions.folderExceptions.includes(segment));

      if (isException) {
        continue;
      }
      strings = strings.concat(await extractStringsFromFolder(filePath, exceptions));
    } else if (file.endsWith('.dart')) {
      const fileStrings = extractStringsFromFile(filePath, exceptions);
      strings = strings.concat(fileStrings);
    }
  }

  return strings;
}

export function extractStringsFromFile(filePath: string, exceptions: any): string[] {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  let strings: string[] = [];
  vscode.window.showInformationMessage('Strings extracted from file: ' + exceptions.extractFilter);

  for (const line of lines) {
    if (line.startsWith('import') || exceptions.lineExceptions.some((exc: string) => line.startsWith(exc))) {
      continue;
    }
    var lineStrings: string[] = [];

    if (exceptions.extractFilter.length > 0) {
      lineStrings = exceptions.extractFilter.flatMap((filter: string | RegExp) => {
        const regex = new RegExp(filter, 'g');
        return line.match(regex) || [];
      });
    }
    else {
      lineStrings = [
        ...(line.match(/"([^"]*)"/g) || []).map(str => str.replace(/"/g, '')),
        ...(line.match(/'([^']*)'/g) || []).map(str => str.replace(/'/g, ''))
      ];

    }


    const filteredStrings = lineStrings.filter(str =>
      !exceptions.textExceptions.includes(str) &&
      !exceptions.contentExceptions.some((exc: string) => str.includes(exc))
    );

    strings = strings.concat(filteredStrings);
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

export function replaceStringsInFiles(folderPath: string, exceptions: any, translations: { [key: string]: string }) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      const folderName = path.basename(filePath);
      const folderSegments = filePath.split(path.sep);
      const isException = folderSegments.some(segment => exceptions.folderExceptions.includes(segment));

      if (isException) {
        continue;
      }
      replaceStringsInFiles(filePath, exceptions, translations);
    } else if (file.endsWith('.dart')) {
      let fileContent = fs.readFileSync(filePath, 'utf8');
      let updatedContent = fileContent; // Copy original content

      for (const [key, value] of Object.entries(translations)) {
        const regex = new RegExp(`(["'])${value}(["'])`, 'g');
        const replacement = `${exceptions.key.replace('key', key)}`;
        updatedContent = updatedContent.replace(regex, replacement);
      }
      if (fileContent !== updatedContent) {
        exceptions.import.forEach((importStatement: string) => {
          if (!updatedContent.includes(importStatement) && !exceptions.import.includes(importStatement)) {
            updatedContent = importStatement + '\n' + updatedContent;
          }
        });
        fs.writeFileSync(filePath, updatedContent, 'utf8');
      }
    }
  }
}