# Repository Guidelines

## Project Structure & Module Organization

This repository is currently minimal: `README.md` is the only tracked project file. Keep new work organized from the start:

- `src/` for application or content-generation source code.
- `tests/` for automated tests that mirror the `src/` layout.
- `assets/` for images, datasets, fonts, or other static resources.
- `docs/` for longer contributor notes, research notes, and generated documentation.

Use clear, topic-based filenames such as `src/scientists_catalog.py`, `assets/timelines/`, or `docs/sources.md`.

## Build, Test, and Development Commands

No build system or package manager is configured yet. Add commands here when tooling is introduced. Recommended patterns:

- `python -m pytest` runs Python tests if the project uses Python.
- `npm test` runs JavaScript/TypeScript tests if a Node toolchain is added.
- `npm run lint` or `ruff check .` runs linting, depending on the chosen stack.

When adding a toolchain, include the exact setup and run commands in `README.md`.

## Coding Style & Naming Conventions

Follow the conventions of the language introduced. Prefer readable, descriptive names over abbreviations. Use lowercase snake_case for Python files and functions, kebab-case for static asset filenames, and PascalCase for classes or components where the language convention expects it.

Keep source files UTF-8 encoded, especially for Arabic text and names. Avoid committing garbled text; verify multilingual content renders correctly before opening a pull request.

## Testing Guidelines

Add tests alongside new behavior. Mirror source paths where practical, for example `tests/test_scientists_catalog.py` for `src/scientists_catalog.py`. Tests should cover parsing, data validation, search/filter behavior, and any date or timeline logic. Include small fixture files in `tests/fixtures/` when sample data is needed.

## Commit & Pull Request Guidelines

The current history only contains `Initial commit`, so no project-specific commit convention is established yet. Use concise imperative messages, for example `Add scientist catalog parser` or `Fix Arabic text encoding`.

Pull requests should include a short summary, the commands run for verification, linked issues when applicable, and screenshots for UI or rendered-document changes. Keep PRs focused: separate content additions, tooling changes, and refactors when possible.

## Security & Configuration Tips

Do not commit secrets, API keys, or private datasets. Put local configuration in ignored environment files such as `.env`, and document required variables with safe examples in `.env.example`.
