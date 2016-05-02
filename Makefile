SHELL := /bin/bash

EXEC=compile

all: $(EXEC)

compile:
	glib-compile-schemas data/ --targetdir=schemas
