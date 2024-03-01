;;; simsapa.el --- Description -*- lexical-binding: t; -*-
;;
;; Copyright (C) 2024 Gambhiro Bhikkhu
;;
;; Author: Gambhiro Bhikkhu <gambhiro@users.noreply.github.com>
;; Maintainer: Gambhiro Bhikkhu <gambhiro@users.noreply.github.com>
;; Created: March 01, 2024
;; Modified: March 01, 2024
;; Version: 0.1.0.20240301
;; Keywords: languages
;; Homepage: https://github.com/simsapa/simsapa-extensions-and-plugins/
;; Package-Requires: ((emacs "24.3"))
;;
;; This file is not part of GNU Emacs.
;;
;;; Commentary:
;;
;;  Description
;;
;;; Code:

(require 'request)
(require 'json)

(defun simsapa~get-selection-or-word ()
  "Return the current selection or the word under the cursor."
  (if (use-region-p)
      (buffer-substring-no-properties (region-beginning) (region-end))
    (thing-at-point 'word)))

(defun simsapa~lookup-text (&optional text)
  "Lookup the selection or current word.
If TEXT argument is given, it will be used instead."
  (interactive)
  (let* ((text (if text text (simsapa~get-selection-or-word)))
         (url "http://localhost:4848/lookup_window_query")
         (data (json-encode `((query_text . ,text)))))

    (request
      url
      :type "POST"
      :data data
      :headers '(("Content-Type" . "application/json"))
      :parser 'buffer-string
      :success (cl-function
                (lambda (&key _data &allow-other-keys)
                  (message "Simsapa lookup: OK")))
      :error (cl-function
              (lambda (&key error-thrown &allow-other-keys)
                (message "Simsapa may be offline. Error message: %S" error-thrown))))))

(global-set-key (kbd "C-x C-l") 'simsapa~lookup-text)

(provide 'simsapa)
;;; simsapa.el ends here
