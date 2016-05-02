SHELL := /bin/bash

EXEC=compile

EXTNAME=pomodoro@l.callarec.gmail.com
EXTPATH=~/.local/share/gnome-shell/extensions/$(EXTNAME)

all: $(EXEC)

compile:
	glib-compile-schemas data/ --targetdir=schemas

install:
	mkdir -p $(EXTPATH)
	rm -rf $(EXTPATH)
	cp -fR . $(EXTPATH)

enable:
	gnome-shell-extension-tool -e pomodoro@l.callarec.gmail.com

disable:
		gnome-shell-extension-tool -d pomodoro@l.callarec.gmail.com
