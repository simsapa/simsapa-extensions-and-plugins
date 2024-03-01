import re
import pynvim
import requests

def sanitize_selection(text: str) -> str:
    """Remove Markdown syntax which may be part of a double-click selection."""
    return re.sub(r"[\`\#\*_]", "", text).strip()

@pynvim.plugin
class SimsapaPlugin(object):
    def __init__(self, nvim):
        self.nvim = nvim

    def get_visual_selection(self):
        """
        https://github.com/neovim/neovim/pull/21115#issuecomment-1320900205

        Translation of the following VimScript:

        function get_visual()
          local _, ls, cs = unpack(vim.fn.getpos('v'))
          local _, le, ce = unpack(vim.fn.getpos('.'))
          return vim.api.nvim_buf_get_text(0, ls-1, cs-1, le-1, ce, {})
        end

        Other methods:
        https://stackoverflow.com/questions/1533565/how-to-get-visually-selected-text-in-vimscript
        """

        # Get the start and end positions of the visual selection
        visual_start = self.nvim.funcs.getpos("'<")
        visual_end = self.nvim.funcs.getpos("'>")

        # Adjust the positions for use with nvim_buf_get_text
        start_line = visual_start[1] - 1
        start_col = visual_start[2] - 1
        end_line = visual_end[1] - 1
        end_col = visual_end[2]

        # Retrieve the text from the buffer
        texts = self.nvim.current.buffer.api.get_text(start_line, start_col, end_line, end_col, {})
        return " ".join(texts)

    def print_msg(self, msg):
        self.nvim.out_write(msg + "\n")

    def print_to_status_line(self, text):
        self.nvim.command('set statusline=%s' % text)

    @pynvim.function('GetSelectionOrWord')
    def get_selection_or_word(self):
        # Check for visual mode. get_visual_selection() does not work in Visual Line or Visual Block mode.
        mode = self.nvim.eval('mode()')
        if mode == 'v':
            text = self.get_visual_selection()
        else:
            text = self.nvim.funcs.expand('<cword>')

        return sanitize_selection(text)

    @pynvim.command("LookupWindowQuery", nargs='*', range='')
    def lookup_window_query(self, __args__, __range__):
        text = self.get_selection_or_word()
        data = {"query_text": text}

        try:
            resp = requests.post("http://localhost:4848/lookup_window_query", json=data)
            if resp.ok:
                msg = "Simsapa lookup: OK"
            else:
                msg = f"Simsapa lookup: Error {resp.status_code}"

        except requests.exceptions.ConnectionError:
            msg = "Simsapa is offline."

        self.print_msg(msg)

    @pynvim.autocmd('BufEnter', pattern='*.md', eval='expand("<afile>")', sync=True)
    def on_md_file_opened(self, __filename__):
        # Bind the command to Ctrl + L when a Markdown file is opened
        self.nvim.command("nnoremap <buffer> <silent> <C-L> :LookupWindowQuery<CR>")
        # <CR> cancels the selection, so it is necessary to re-select it with gv
        self.nvim.command("vnoremap <buffer> <silent> <C-L> :LookupWindowQuery<CR> gv")
