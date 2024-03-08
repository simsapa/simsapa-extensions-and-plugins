# Simsapa Extensions and Plugins

Companion tools for the [Simsapa Dhamma Reader](https://simsapa.github.io/) sutta reader and Pāli dictionary application.

- Firefox: [addons.mozilla.org](https://addons.mozilla.org)
- Chrome: [chrome.google.com](https://chrome.google.com/webstore/category/extensions)
- Obsidian: [obsidian.md/plugins](https://obsidian.md/plugins)
- Joplin: [joplinapp.org/plugins](https://joplinapp.org/plugins/)
- [Emacs package](#emacs)
- [Neovim plugin](#neovim)
- [Google Docs addon](#google-docs)

<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-refresh-toc -->
**Table of Contents**

- [Install](#install)
    - [Emacs](#emacs)
    - [Neovim](#neovim)
    - [Google Docs](#google-docs)
- [Development](#development)
    - [Clone and build](#clone-and-build)
    - [Install from the local folder](#install-from-the-local-folder)

<!-- markdown-toc end -->

## Install

- Firefox: [addons.mozilla.org](https://addons.mozilla.org)
- Chrome: [chrome.google.com](https://chrome.google.com/webstore/category/extensions)
- Obsidian: [obsidian.md/plugins](https://obsidian.md/plugins)
- Joplin: [joplinapp.org/plugins](https://joplinapp.org/plugins/)

### Emacs

Clone this repository or download `src-emacs/simsapa.el`.

``` emacs-lisp
(add-to-list 'load-path "~/path/to/simsapa-extensions-and-plugins/src-emacs/")
(require 'simsapa)
```

**Test it:**

Start the Simsapa app, close the main window and let the app stay in the
background. The plugin makes HTTP reqests to the application.

Open this **README.md** file.

Either select or place the cursor on the following word and press `C-x C-l`: _majjhima patipada_

It should open a _Simsapa Word Lookup_ window with the results (including Pāli accents).

### Neovim

If you are using [vim-plug](https://github.com/junegunn/vim-plug), add this in your config files (such as `~/.config/nvim/init.vim`), in the `call plug#begin() ... call plug#end()` section.

``` vim-script
" Using the github repository
Plug 'simsapa/simsapa-extensions-and-plugins', { 'rtp': 'src-neovim' }

" Or, if you cloned the repository:
Plug '~/path/to/simsapa-extensions-and-plugins', { 'rtp': 'src-neovim' }
```

Use `:UpdateRemotePlugins` to install.

**Test it:**

Start the Simsapa app, close the main window and let the app stay in the
background. The plugin makes HTTP reqests to the application.

Open this **README.md** file.

Either select or place the cursor on the following word and press `Ctrl+L`: _majjhima patipada_

It should open a _Simsapa Word Lookup_ window with the results (including Pāli accents).

### Google Docs

TODO: add instructions.

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




