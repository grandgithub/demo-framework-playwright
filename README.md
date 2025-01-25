# demo-framework-playwright
playwright framework demo

## Tests (tests folder)
- API testing
  - description: tests API endpoints including authorization and common request types
  - file: tests/api.spec.ts
  - how to run: npx playwright test api.spec.ts --workers=1
- Files downloading
  - description: tests files downloading by click on element and from a direct link
  - file: test/download-files.spec.ts
  - how to run: npx playwright test download-files.spec.ts