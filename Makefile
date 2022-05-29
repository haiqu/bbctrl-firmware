DIR := $(shell dirname $(lastword $(MAKEFILE_LIST)))

NODE_MODS  := $(DIR)/node_modules
PUG        := $(NODE_MODS)/.bin/pug
STYLUS     := $(NODE_MODS)/.bin/stylus

TARGET_DIR := build/http
HTML       := index
HTML       := $(patsubst %,$(TARGET_DIR)/%.html,$(HTML))
RESOURCES  := $(shell find src/resources -type f)
RESOURCES  := $(patsubst src/resources/%,$(TARGET_DIR)/%,$(RESOURCES))
TEMPLS     := $(wildcard src/pug/templates/*.pug)

AVR_FIRMWARE    := src/avr/bbctrl-avr-firmware.hex
CAMOTICS_MOD    := share/camotics/build/camotics.so
CAMOTICS_TARGET := src/py/bbctrl/camotics.so

RSYNC_EXCLUDE := \*.pyc __pycache__ \*.egg-info \\\#* \*~ .\\\#\*
RSYNC_EXCLUDE := $(patsubst %,--exclude %,$(RSYNC_EXCLUDE))
RSYNC_OPTS    := $(RSYNC_EXCLUDE) -rv --no-g --delete --force

VERSION  := $(shell sed -n 's/^.*"version": "\([^"]*\)",.*$$/\1/p' package.json)
PKG_NAME := bbctrl-$(VERSION)
PUB_PATH := root@buildbotics.com:/var/www/buildbotics.com/bbctrl
BETA_VERSION := $(VERSION)-rc$(shell ./scripts/next-rc)
BETA_PKG_NAME := bbctrl-$(BETA_VERSION)

SUBPROJECTS := avr boot pwr2 jig
WATCH := src/pug src/pug/templates src/stylus src/js src/resources Makefile
WATCH += src/static

ifndef HOST
HOST=bbctrl.local
endif

ifndef PASSWORD
PASSWORD=buildbotics
endif


all: $(HTML) $(RESOURCES)
	@for SUB in $(SUBPROJECTS); do $(MAKE) -C src/$$SUB; done

demo: $(HTML) $(RESOURCES) bbemu
	ln -sf ../../../$(TARGET_DIR) src/py/bbctrl/http
	./setup.py install
	cp src/avr/emu/bbemu /usr/local/bin

bbemu:
	$(MAKE) -C src/avr/emu

pkg: all $(AVR_FIRMWARE) bbserial
	cp -a share/camotics/tpl_lib src/py/bbctrl/
	./setup.py sdist

beta-pkg: pkg
	cp dist/$(PKG_NAME).tar.bz2 dist/$(BETA_PKG_NAME).tar.bz2

bbserial:
	$(MAKE) -C src/bbserial

container-update:
	./scripts/container-update

container-init: container-update
	./scripts/container-run ./bbctrl-firmware/scripts/container-init

arm-bin: camotics bbkbd updiprog rpipdi

camotics: $(CAMOTICS_TARGET)

$(CAMOTICS_TARGET): $(CAMOTICS_MOD)
	cp $< $@

$(CAMOTICS_MOD): container-update
	./scripts/container-run ./bbctrl-firmware/scripts/container-make-camotics

bbkbd: container-update
	./scripts/container-run "make -C bbkbd"

updiprog: container-update
	./scripts/container-run "make -C updiprog"

rpipdi: container-update
	./scripts/container-run "make -C rpipdi"

.PHONY: $(AVR_FIRMWARE)
$(AVR_FIRMWARE):
	$(MAKE) -C src/avr

publish: pkg
	echo -n $(VERSION) > dist/latest.txt
	rsync $(RSYNC_OPTS) dist/$(PKG_NAME).tar.bz2 dist/latest.txt $(PUB_PATH)/

publish-beta: beta-pkg
	echo -n $(BETA_VERSION) > dist/latest-beta.txt
	rsync $(RSYNC_OPTS) dist/$(BETA_PKG_NAME).tar.bz2 dist/latest-beta.txt \
	  $(PUB_PATH)/

update: pkg
	http_proxy= curl -i -X PUT -H "Content-Type: multipart/form-data" \
	  -F "firmware=@dist/$(PKG_NAME).tar.bz2" -F "password=$(PASSWORD)" \
	  http://$(HOST)/api/firmware/update
	@-tput sgr0 && echo # Fix terminal output

build/templates.pug: $(TEMPLS)
	mkdir -p build
	cat $(TEMPLS) >$@

node_modules: package.json
	npm install && touch node_modules

$(TARGET_DIR)/%: src/resources/%
	install -D $< $@

$(TARGET_DIR)/index.html: build/templates.pug
$(TARGET_DIR)/index.html: $(wildcard src/static/js/*)
$(TARGET_DIR)/index.html: $(wildcard src/static/css/*)
$(TARGET_DIR)/index.html: $(wildcard src/js/*)
$(TARGET_DIR)/index.html: $(wildcard src/stylus/*)
$(TARGET_DIR)/index.html: src/resources/config-template.json

$(TARGET_DIR)/%.html: src/pug/%.pug node_modules
	@mkdir -p $(shell dirname $@)
	$(PUG) -O pug-opts.js -P $< -o $(TARGET_DIR) || (rm -f $@; exit 1)

pylint:
	pylint -E $(shell find src/py -name \*.py | grep -v flycheck_)

jshint:
	./node_modules/jshint/bin/jshint --config jshint.json src/js/*.js

lint: pylint jshint

watch:
	@clear
	$(MAKE)
	@while sleep 1; do \
	  inotifywait -qr -e modify -e create -e delete \
		--exclude .*~ --exclude \#.* $(WATCH); \
	  clear; \
	  $(MAKE); \
	done

tidy:
	rm -f $(shell find "$(DIR)" -name \*~)

clean: tidy
	rm -rf build html dist
	@for SUB in $(SUBPROJECTS); do \
	  $(MAKE) -C src/$$SUB clean; \
	done

dist-clean: clean
	rm -rf node_modules

.PHONY: all install clean tidy pkg camotics lint pylint jshint bbserial
.PHONY: html resources dist-clean
