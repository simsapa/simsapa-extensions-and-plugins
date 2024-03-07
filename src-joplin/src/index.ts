import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation } from 'api/types';
import * as path from 'path';

import { WebSocketServer } from "ws";

const SIMSAPA_BASE_URL = "http://localhost:4848";
const HEARTBEAT_TIME_MS = 10000; // 10s

const SERVER_PORT = 5353;
export const WS_SERVER_PORT = 5354;

interface AppObj {
    server: Object;
    ws_server: WebSocketServer | null;
    ws_sockets: any[];
    ws_heartbeat_timer: NodeJS.Timer | null;
}

function sanitize_selection(text: string): string {
    // Remove Markdown syntax which may be part of a double-click selection.
    return text.replace(/[\`\#\*_]/g, "");
}

function show_word(uid: string): void {
    const url = SIMSAPA_BASE_URL + "/lookup_window_query";
    const data = { query_text: uid };

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(data),
    })
        .catch(error => console.error('Error:', error));
}

joplin.plugins.register({

    onStart: async function () {
        const panel = await joplin.views.panels.create('panel_simsapa');
        await joplin.views.panels.hide(panel);
        await joplin.views.panels.setHtml(panel, '<h1>Loading...</h1>');

        await joplin.views.panels.addScript(panel, 'styles.css');

        let app: AppObj = {
            server: {},
            ws_server: null,
            ws_sockets: [],
            ws_heartbeat_timer: null,
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

            server.listen(SERVER_PORT);
        }

        async function start_websocket_server(app: AppObj) {
            app.ws_server = new WebSocketServer({ port: WS_SERVER_PORT });
            app.ws_sockets = [];

            // keep the connection alive, msg every 10s
            app.ws_heartbeat_timer = setInterval(send_ws_heartbeat, HEARTBEAT_TIME_MS);

            app.ws_server.on('connection', (socket: any) => {
                app.ws_sockets.push(socket);

                // socket.on('message', (data: any) => {
                //     console.log("client says: ", data);
                // });

                // When a socket closes, or disconnects, remove it from the array.
                socket.on('close', () => {
                    app.ws_sockets = app.ws_sockets.filter((s: any) => s !== socket);
                });
            });

            app.ws_server.on('close', () => {
                if (app.ws_heartbeat_timer) {
                    // @ts-ignore
                    clearInterval(app.ws_heartbeat_timer);
                    app.ws_heartbeat_timer = null;
                }
            });
        }

        function send_ws_heartbeat() {
            if (app.ws_server) {
                app.ws_sockets.forEach(s => s.send("ping"));
            }
        }

        function simsapa_sidebar_lookup(sel_txt: string): void {
            const data = JSON.stringify({
                "selection": sel_txt,
            });
            app.ws_sockets.forEach(s => s.send(data));
        }

        function simsapa_app_lookup(sel_txt: string): void {
            show_word(sel_txt);
        }

        async function is_sidebar_open(): Promise<boolean> {
            return await joplin.views.panels.visible(panel);
        }

        function simsapa_lookup(sel_txt: string): void {
            sel_txt = sanitize_selection(sel_txt);
            is_sidebar_open().then((is_open) => {
                if (is_open) {
                    simsapa_sidebar_lookup(sel_txt);
                } else {
                    simsapa_app_lookup(sel_txt);
                }
            })
        }

        start_static_server(app);
        start_websocket_server(app);

        // NOTE: It is necessary to expand the wrapper div. height: 100% doesn't
        // work, and the iframe remains minimum height.

        const html = `
<div style="height: calc(100vh - 50px);" class="simsapa-view-wrap">
    <div class="sidebar-title">Simsapa</div>
    <iframe src="http://localhost:${SERVER_PORT}/sidebar.html" allow="clipboard-write"></iframe>
</div>`

        await joplin.views.panels.setHtml(panel, html);

        // Register a command and add the toolbar icon and Tools menu item.

        await joplin.commands.register({
            name: 'simsapa-open-sidebar',
            label: 'Simsapa: Open Sidebar',
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

        await joplin.commands.register({
            name: 'simsapa-lookup-selection-in-dictionary',
            label: 'Simsapa: Lookup Selection in Dictionary',
            iconName: 'fas fa-book',
            execute: async () => {
                const sel = await joplin.commands.execute('selectedText');
                simsapa_lookup(`${sel}`);
            },
        });

        await joplin.views.toolbarButtons.create(
            'simsapa-button',
            'simsapa-open-sidebar',
            ToolbarButtonLocation.NoteToolbar,
        );

        await joplin.views.menuItems.create(
            'simsapa-menu-sidebar',
            'simsapa-open-sidebar',
            MenuItemLocation.Tools,
            { accelerator: 'CmdOrCtrl+Shift+F10' },
        );

        await joplin.views.menuItems.create(
            'simsapa-menu-lookup',
            'simsapa-lookup-selection-in-dictionary',
            MenuItemLocation.Tools,
            { accelerator: 'CmdOrCtrl+Shift+D' },
        );
    },
});
