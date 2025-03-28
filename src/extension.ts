// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { extractStringsFromFolder, replaceStringsInFiles, generateTranslations, saveTranslations } from './utils';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let makePrepairefile = vscode.commands.registerCommand('translatehelper.makePrepairefile', async () => {
    const projectRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!projectRoot) {
      vscode.window.showErrorMessage('Project root not found');
      return;
    }

    try {
      const exceptionsPath = path.join(projectRoot, 'assets', 'translationsHelper', 'prepaire.json');
      const replacePath = path.join(projectRoot, 'assets', 'translationsHelper', 'replace.json');
      const repdirPath = path.dirname(replacePath);
      const dirPath = path.dirname(exceptionsPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      if (!fs.existsSync(repdirPath)) {
        fs.mkdirSync(repdirPath, { recursive: true });
      }

      // Define the JSON content
      const exceptionsData = {
        "textExceptions": ["import"],
        "lineExceptions": ["line_start_to_skip"],
        "contentExceptions": ["substring_to_skip"],
        "folderExceptions": ["domain"],
        "extractFilter": ["([\\u0600-\\u06FF\\s]+)"],
        "import": [
          "import 'package:easy_localization/easy_localization.dart';",
        ],
        "key": "'{key}'.tr()"
      };

      // Write the JSON content to the file
      fs.writeFileSync(exceptionsPath, JSON.stringify(exceptionsData, null, 2));
      fs.writeFileSync(replacePath, JSON.stringify({}, null, 2));
      vscode.window.showInformationMessage('Prepaire file created successfully!');
    } catch (error) {
      vscode.window.showErrorMessage(`Error creating prepaire file: ${error}`);
    }

  });
  let translatereplace = vscode.commands.registerCommand('translatehelper.translatereplace', async (uri: vscode.Uri) => {
    const projectRoot: string = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? "";
    //const replacePath = projectRoot ?? uri.fsPath;

    const projectReplacedata = path.join(projectRoot, 'assets', 'translations', 'replace.json');

    const replacePath: string = uri.fsPath ?? projectRoot;
    const repdirPath = path.dirname(replacePath);

    if (!projectReplacedata) {
      vscode.window.showErrorMessage('replace file not found please make file at ' + projectReplacedata);
      return;
    }

    try {

      if (!fs.existsSync(repdirPath)) {
        //vscode.window.showErrorMessage(`replace file not found please make file at ` + replacePath);
        vscode.window.showInformationMessage(`replace file not found please make file at ` + replacePath);
        return;
      }
      const fileContent = fs.readFileSync(projectReplacedata, 'utf8');
      const replaceData = JSON.parse(fileContent);
      const exceptions = readExceptionsFile(projectRoot);
      replaceStringsInFiles(replacePath, exceptions, replaceData);


      vscode.window.showInformationMessage('Prepaire file created successfully!');
    } catch (error) {
      vscode.window.showErrorMessage(`Error creating prepaire file: ${error}`);
    }

  });
  let extractStrings = vscode.commands.registerCommand('translatehelper.extractStrings', async (uri: vscode.Uri) => {
    if (uri && uri.fsPath) {
      const projectRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!projectRoot) {
        vscode.window.showErrorMessage('Project root not found');
        return;
      }

      try {
        const exceptions = readExceptionsFile(projectRoot);
        const strings = await extractStringsFromFolder(uri.fsPath, exceptions);
        const translations = generateTranslations(strings);
        vscode.window.showErrorMessage(translations.toLowerCase);

        saveTranslations(translations, path.join(projectRoot, 'assets', 'translations', 'en2.json'));
        vscode.window.showInformationMessage('Strings extracted and saved successfully!');
      } catch (error) {
        vscode.window.showErrorMessage(`Error extracting strings: ${error}`);
      }
    }
  });

  let extractRemoveStrings = vscode.commands.registerCommand('translatehelper.extractAndReplace', async (uri: vscode.Uri) => {
    if (uri && uri.fsPath) {
      try {
        const projectRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!projectRoot) {
          vscode.window.showErrorMessage('Project root not found');
          return;
        }

        const exceptions = readExceptionsFile(projectRoot);
        const strings = await extractStringsFromFolder(uri.fsPath, exceptions);
        const translations = generateTranslations(strings);
        replaceStringsInFiles(uri.fsPath, exceptions, translations,);
        const translationsPath = path.join(projectRoot, 'assets', 'translations', 'en3.json');
        saveTranslations(translations, translationsPath);
        vscode.window.showInformationMessage('Strings extracted and saved successfully!');
      } catch (error) {
        vscode.window.showErrorMessage(`Error extracting strings: ${error}`);
      }
    }
  });

  context.subscriptions.push(extractRemoveStrings, makePrepairefile, extractStrings, translatereplace);

}

export function readExceptionsFile(projectRoot: string) {
  const exceptionsPath = path.join(projectRoot, 'assets', 'translationsHelper', 'prepaire.json');
  if (!fs.existsSync(exceptionsPath)) {
    return { textExceptions: [], lineExceptions: [], contentExceptions: [], folderExceptions: [], extractFilter: [], import: [], key: "{key}.tr()" };
  }

  const fileContent = fs.readFileSync(exceptionsPath, 'utf8');
  const exceptions = JSON.parse(fileContent);

  return {
    textExceptions: exceptions.textExceptions || [],
    lineExceptions: exceptions.lineExceptions || [],
    contentExceptions: exceptions.contentExceptions || [],
    folderExceptions: exceptions.folderExceptions || [],
    extractFilter: exceptions.extractFilter || [],
    import: exceptions.import || [],
    key: exceptions.key || "{key}.tr()"
  };
}

// This method is called when your extension is deactivated
export function deactivate() { }
