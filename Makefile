.PHONY: all
TESTS = tests/index.js

all:
	@npm install

test: all
	@./node_modules/.bin/mocha --exit --trace-warnings --trace-deprecation --retries 0 --full-trace --timeout 5000 --check-leaks --reporter spec $(TESTS)

clean:
	rm -rf node_modules