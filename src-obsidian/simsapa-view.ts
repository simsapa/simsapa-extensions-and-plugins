import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_SIMSAPA = "simsapa-view";

export class SimsapaView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_SIMSAPA;
    }

    getDisplayText() {
        return "Simsapa";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.className = "simsapa-view-wrap"

        let title = document.createElement('div');
        title.textContent = "Simsapa"
        title.className = "sidebar-title"
        container.appendChild(title)

        let iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:5000/sidebar.html';
        iframe.allow = "clipboard-write"

        container.appendChild(iframe)
        this.containerEl.appendChild(container);
    }

    async onClose() {}
}
