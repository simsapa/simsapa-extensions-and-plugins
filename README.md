# Simsapa Extensions and Plugins

Companion tools for the [Simsapa Dhamma Reader](https://simsapa.github.io/) sutta reader and Pāli dictionary application.

- Firefox: [addons.mozilla.org](https://addons.mozilla.org)
- Chrome: [chrome.google.com](https://chrome.google.com/webstore/category/extensions)
- Obsidian: [obsidian.md/plugins](https://obsidian.md/plugins)
- Joplin: [joplinapp.org/plugins](https://joplinapp.org/plugins/)
- [Emacs package](src-emacs/README.md)
- [Neovim plugin](src-neovim/README.md)
- [Google Docs addon](src-gdocs/README.md)

## Development

### Clone and build

Clone the repository.

``` shell
git clone https://github.com/simsapa/simsapa-extensions-and-plugins.git
cd simsapa-extensions-and-plugins
```

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




