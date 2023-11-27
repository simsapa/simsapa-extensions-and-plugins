/**
 * @OnlyCurrentDoc
 */

// No trailing slash
const SIMSAPA_BASE_URL = "http://localhost:4848"

function onOpen(_e: Event): void {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Show Sidebar', 'show_sidebar')
      .addToUi();
}

function onInstall(e: Event): void {
  onOpen(e);
}

function show_sidebar(): void {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Simsapa');
  DocumentApp.getUi().showSidebar(ui);
}

