# Simsapa Emacs package

Clone this repository or download `src-emacs/simsapa.el`.

``` emacs-lisp
(add-to-list 'load-path "~/path/to/simsapa-extensions-and-plugins/src-emacs/")
(require 'simsapa)
```

## Try it

Start the Simsapa app, close the main window and let the app stay in the
background. The plugin makes HTTP reqests to the application.

Open this **README.md** file.

Either select or place the cursor on the following word and press `C-x C-l`: _majjhima patipada_

It should open a _Simsapa Word Lookup_ window with the results (including Pāli accents).
