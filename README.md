# RepoHelper

RepoHelper is a VS Code extension that assists in extracting, translating, and replacing strings in your Dart projects. This extension is especially useful for managing localization in Flutter applications.

## Features

- **Extract Strings**: Extracts all strings from the selected folder and saves them into a JSON file.
- **Extract and Replace Strings**: Extracts all strings from the selected folder, replaces them with translation keys, and saves the translations into a JSON file.
- **Handle Exceptions**: Skips specific lines, strings, or folders during extraction based on an `exception.json` file.

## Installation

1. Clone this repository.
2. Open the cloned repository in VS Code.
3. Run `npm install` to install the dependencies.
4. Press `F5` to launch the extension.

## Usage

### Extract Strings

1. Right-click on any folder in the VS Code Explorer.
2. Select `RepoHelper: Extract Strings`.
3. The strings will be extracted and saved in `assets/translations/en2.json` in the project root.

### Extract and Replace Strings

1. Right-click on any folder in the VS Code Explorer.
2. Select `RepoHelper: Extract and Replace Strings`.
3. The strings will be extracted, replaced with translation keys, and saved in `assets/translations/en3.json` in the project root.

### Handling Exceptions

Create an `exception.json` file in `src/Exceptions/` with the following structure:

```json
{
  "textExceptions": ["string_to_skip"],
  "lineExceptions": ["line_start_to_skip"],
  "contentExceptions": ["substring_to_skip"],
  "folderExceptions": ["folder_name_to_skip"]
}
