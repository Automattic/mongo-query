
test:
	@./node_modules/.bin/mocha \
		--bail \
		test/

.PHONY: test
