# Simsapa Extensions and Plugins

Companion tools for the [Simsapa Dhamma Reader](https://simsapa.github.io/) sutta reader and Pāli dictionary application.

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/simsapa/)
- Chrome:
  - Install from the .zip file for the time being, [see the steps](https://github.com/simsapa/simsapa-extensions-and-plugins?tab=readme-ov-file#install-the-chrome-plugin)
- [Obsidian](https://obsidian.md/)
  - Install from Obsidian: Settings > Community Plugins > Browse
  - Repo: [simsapa-obsidian](https://github.com/simsapa/simsapa-obsidian)
- [Joplin](https://joplinapp.org/)
  - Install from Joplin: Tools > Options > Plugins
  - Repo: [simsapa-joplin](https://github.com/simsapa/simsapa-joplin)
- [Emacs package](https://github.com/simsapa/simsapa-emacs)
- [Neovim plugin](https://github.com/simsapa/simsapa-neovim)
- [Google Docs addon](https://github.com/simsapa/simsapa-gdocs)

## Install the Chrome plugin

The Chrome plugin is not yet published in the web store.

- Download [simsapa-chrome.zip](https://github.com/simsapa/simsapa/releases/download/v0.5.0-alpha.1/simsapa-chrome.zip)
- Extract to a folder
- Open [Manage Extensions](chrome://extensions/)
- Enable `Developer mode` in the top-right corner
- Click `Load unpacked`, open the extracted extension folder
- The extension is now installed
- (📙 NOTE: Deleting the folder also removes the extension)

## Development

### Clone and build

The extension sidebar is built in this repository (`src/sidebar.ts`), and bundled into the extensions as sub-module repos.

Clone the repository **with the submodules:**

``` shell
git clone --recurse-submodules https://github.com/simsapa/simsapa-extensions-and-plugins.git
cd simsapa-extensions-and-plugins
```

Later you can update the submodules with:

``` shell
git submodule update --recursive --remote
```

### Setup

Setup the dependencies. [Poetry](https://python-poetry.org/docs/#installation) is required for Python packages.

``` shell
npm install

poetry install

npm install -g web-ext
```

The Obsidian and Joplin plugins have further dependencies:

```
cd src-obsidian
# or
cd src-joplin
npm install
```

For the Google Docs Addon:

```
npm install -g @google/clasp
```

Start the Python venv and run the relevant `make` target to build the extension:

``` shell
poetry shell

make dist-firefox
make dist-chrome
make dist-obsidian
make dist-joplin
make dist-gdocs
```

(The Emacs and Neovim package doesn't need a build step.)

### Install from the local folder

The packaged (.zip) extension files will be in the `dist/` folder.

The un-packaged extension will be in the folders:

``` shell
dist-firefox/
dist-chrome/
dist-obsidian/
dist-joplin/
dist-gdocs/
```




