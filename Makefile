addon.js:
	tsc -p ./src-addon/tsconfig.json

sidebar.css:
	node ./node_modules/sass/sass.js --no-source-map src/sidebar.sass:dist-firefox/sidebar.css

sidebar.html-addon:
	./scripts/render_html.py src/sidebar.mako.html dist-addon/sidebar.html addon

sidebar.html-firefox:
	./scripts/render_html.py src/sidebar.mako.html dist-firefox/sidebar.html firefox

sidebar.js:
	npx webpack

clean-addon:
	rm -r dist-addon && mkdir dist-addon

clean-firefox:
	rm -r dist-firefox && mkdir dist-firefox

clean-chrome:
	rm -r dist-chrome && mkdir dist-chrome

clean-obsidian:
	rm -r dist-obsidian && mkdir dist-obsidian

dist-addon: addon.js sidebar.css sidebar.js sidebar.html-addon
	cp src-addon/appsscript.json dist-addon/
	cp src-addon/.claspignore dist-addon/
	clasp push

dist-firefox: sidebar.css sidebar.js sidebar.html-firefox
	cp -r src/icons/ dist-firefox/
	cp src/background.js dist-firefox/
	cp src/docs-user-style.css dist-firefox/
	cp src/manifest-firefox.json dist-firefox/manifest.json
	web-ext lint --source-dir dist-firefox/

dist-chrome: sidebar.css sidebar.js sidebar.html-firefox
	cp dist-firefox/sidebar.css dist-chrome/
	cp dist-firefox/sidebar.html dist-chrome/
	cp dist-firefox/sidebar.js dist-chrome/
	cp -r src/icons/ dist-chrome/
	cp src/background.js dist-chrome/
	cp src/docs-user-style.css dist-chrome/
	cp src/manifest-chrome.json dist-chrome/manifest.json

main.js-obsidian:
	cd src-obsidian && npm run build

styles.css:
	node ./node_modules/sass/sass.js --no-source-map src-obsidian/styles.sass:dist-obsidian/styles.css

dist-obsidian: sidebar.css sidebar.js sidebar.html-firefox main.js-obsidian styles.css
	mkdir -p dist-obsidian/static/
	cp dist-firefox/sidebar.css dist-obsidian/static/
	cp dist-firefox/sidebar.html dist-obsidian/static/
	cp dist-firefox/sidebar.js dist-obsidian/static/
	cp src-obsidian/main.js dist-obsidian/
	cp src-obsidian/manifest.json dist-obsidian/
