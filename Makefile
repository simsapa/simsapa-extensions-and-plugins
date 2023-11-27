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
	rm dist-addon/*

clean-firefox:
	rm dist-firefox/*

dist-addon: addon.js sidebar.css sidebar.js sidebar.html-addon
	cp src-addon/appsscript.json dist-addon/
	cp src-addon/.claspignore dist-addon/
	clasp push

dist-firefox: sidebar.css sidebar.js sidebar.html-firefox
	cp -r src/icons/ dist-firefox/
	cp src/background.js dist-firefox/
	cp src/docs-user-style.css dist-firefox/
	cp src/manifest.json dist-firefox/
