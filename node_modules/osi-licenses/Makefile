build:
	mkdir -p lib
	node_modules/.bin/coffee support/generate.coffee

test:
	node_modules/.bin/mocha

jumpstart:
	curl -u 'meryn' https://api.github.com/user/repos -d '{"name":"osi-licenses", "description":"id-name pairs of OSI-approved licenses","private":false}'
	npm install
	git init
	git remote add origin git@github.com:meryn/osi-licenses
	git add .
	git commit -m "jumpstart commit."
	git push -u origin master

.PHONY: test