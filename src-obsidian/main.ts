import * as path from "path";

import { Editor, MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';
import { SERVER_PORT, SimsapaView, VIEW_TYPE_SIMSAPA, WS_SERVER_PORT } from './simsapa-view';

import { getPluginAbsolutePath, isWindows } from './Common';
import { WebSocketServer } from "ws";

export default class SimsapaPlugin extends Plugin {
	server: any;
	ws_server: any;
	ws_sockets: any[];

	async onload() {
		this.registerView(
			VIEW_TYPE_SIMSAPA,
			(leaf) => new SimsapaView(leaf),
		);

		const ribbon_icon_el = this.addRibbonIcon('book', 'Simsapa', (_evt: MouseEvent) => {
			this.activate_simsapa_view();
		});
		ribbon_icon_el.addClass('my-plugin-ribbon-class');

		this.addCommand({
			id: 'simsapa-open-sidebar',
			name: 'Simsapa: Open Sidebar',
			callback: () => {
				this.activate_simsapa_view();
			}
		});

		this.addCommand({
			id: 'simsapa-lookup-selection-in-dictionary',
			name: 'Simsapa: Lookup Selection in Dictionary',

			// Linux, Windows: Ctrl+Shift+D
			// MacOS: Cmd+Shift+D
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "d" }],
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				const sel = editor.getSelection()
				this.ws_sockets.forEach(s => s.send(`${sel}`));
			},
		});

		this.start_static_server();
		this.start_websocket_server();

		this.registerDomEvent(document, 'dblclick', () => {
			const sel = document.getSelection();
			this.ws_sockets.forEach(s => s.send(`${sel}`));
		});
	}

	onunload() {
		this.server.close();
	}

	async activate_simsapa_view() {
		let { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		let leaves = workspace.getLeavesOfType(VIEW_TYPE_SIMSAPA);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			let leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_SIMSAPA, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf !== null) {
			workspace.revealLeaf(leaf);
		}
	}

	async start_static_server() {
		var finalhandler = require('finalhandler');
		var http = require('http');
		var serve_static = require('serve-static');

		var static_folder = path.join(getPluginAbsolutePath(this, isWindows()), 'static');

		var serve = serve_static(static_folder, { index: ['sidebar.html',] });

		var server = http.createServer(function onRequest(req: any, res: any) {
			serve(req, res, finalhandler(req, res));
		})
		this.server = server;

		server.listen(SERVER_PORT);
	}

	async start_websocket_server() {
		this.ws_server = new WebSocketServer({ port: WS_SERVER_PORT });
		this.ws_sockets = [];

		this.ws_server.on('connection', (socket: any) => {
			this.ws_sockets.push(socket);

			// When a socket closes, or disconnects, remove it from the array.
			socket.on('close', () => {
				this.ws_sockets = this.ws_sockets.filter((s: any) => s !== socket);
			});
		});
	}

	public getPluginId() {
		return this.manifest.id;
	}
}
