.PHONY: dev build install typecheck lint clean \
       ralph-install ralph ralph-once ralph-no-hw ralph-scenario ralph-test ralph-report

dev:
	bun run dev

build:
	bun run build

install:
	bun install

typecheck:
	bun run typecheck

lint:
	bun run lint

clean:
	rm -rf dist node_modules

# Ralph Loop targets
ralph-install:
	cd ralph && bun install

ralph:
	cd ralph && bun run runner.ts --max-iterations 10

ralph-once:
	cd ralph && bun run runner.ts --single-pass --continue-on-failure

ralph-no-hw:
	cd ralph && bun run runner.ts --no-hardware --max-iterations 10

ralph-scenario:
	cd ralph && bun run runner.ts --scenario $(S) --max-iterations $(or $(I),10)

ralph-test:
	cd ralph && bun test

ralph-report:
	@cat ralph/results/latest/summary.md 2>/dev/null || echo "No results. Run 'make ralph' first."
