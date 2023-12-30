import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation } from 'api/types';
import * as path from 'path';

interface AppObj {
    server: Object;
}

joplin.plugins.register({

    onStart: async function () {
        const panel = await joplin.views.panels.create('panel_simsapa');
        await joplin.views.panels.hide(panel);
        await joplin.views.panels.setHtml(panel, '<h1>Loading...</h1>');

        await joplin.views.panels.addScript(panel, 'styles.css');

        let app: AppObj = {
            server: {},
        };

        async function start_static_server(app: AppObj) {
            var finalhandler = require('finalhandler');
            var http = require('http');
            var serve_static = require('serve-static');

            const dir = await joplin.plugins.installationDir();

            var static_folder = path.join(dir, 'static');

            var serve = serve_static(static_folder, { index: ['sidebar.html',] });

            var server = http.createServer(function onRequest(req: any, res: any) {
                serve(req, res, finalhandler(req, res));
            })

            app.server = server;

            server.listen(5000);
        }

        start_static_server(app);

        // NOTE: It is necessary to expand the wrapper div. height: 100% doesn't
        // work, and the iframe remains minimum height.

        const html = `
<div style="height: calc(100vh - 50px);" class="simsapa-view-wrap">
    <div class="sidebar-title">Simsapa</div>
    <iframe src="http://localhost:5000/sidebar.html" allow="clipboard-write"></iframe>
</div>`

        await joplin.views.panels.setHtml(panel, html);

        // Register a command and add the toolbar icon and Tools menu item.

        await joplin.commands.register({
            name: 'toggle_simsapa_panel',
            label: 'Simsapa Panel',
            iconName: 'fas fa-book',
            execute: async () => {
                let visible = await joplin.views.panels.visible(panel);
                if (visible) {
                    await joplin.views.panels.hide(panel);
                } else {
                    await joplin.views.panels.show(panel);
                }
            },
        });

        await joplin.views.toolbarButtons.create(
            'simsapa_button',
            'toggle_simsapa_panel',
            ToolbarButtonLocation.NoteToolbar,
        );

        await joplin.views.menuItems.create(
            'simsapa_menu',
            'toggle_simsapa_panel',
            MenuItemLocation.Tools,
            { accelerator: 'CmdOrCtrl+F9' },
        );
    },
});
