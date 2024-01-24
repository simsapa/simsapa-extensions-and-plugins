import * as path from "path";

import { Plugin, WorkspaceLeaf } from 'obsidian';
import { SERVER_PORT, SimsapaView, VIEW_TYPE_SIMSAPA } from 'simsapa-view';

import { getPluginAbsolutePath, isWindows } from 'Common';

export default class SimsapaPlugin extends Plugin {
	server: any;

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
			id: 'open-simsapa-sidebar',
			name: 'Open Simsapa Sidebar',
			callback: () => {
				this.activate_simsapa_view();
			}
		});

		this.start_static_server();

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

	public getPluginId() {
		return this.manifest.id;
	}
}
