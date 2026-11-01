# AI Design Compiler & Chromium Extension

A high-performance Manifest V3 Chromium extension and multi-pass compiler that compiles rendered web documents into compact semantic design specifications, design knowledge graphs, and AI clone packages.

---

## Executive Summary

Traditional web scrapers and CSS extractors dump bloated, raw DOM trees and computed CSS cascades that overwhelm LLM context windows and force AI code generators to guess visual relationships. 

The **AI Design Compiler** treats the browser's rendered document as high-level source code, compiling it through deterministic compiler passes into declarative semantic contracts:

```text
+-----------------------------------------------------------------------------------+
|                                 Rendered Website                                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Browser In-Page Extraction Engine                          |
|         DOM extraction, computed style normalization, geometry tracking           |
+-----------------------------------------------------------------------------------+
                                         |
                                         v  AgentDesignSpecification (IR)
+-----------------------------------------------------------------------------------+
|                      Deterministic Multi-Pass Compiler Pipeline                   |
|                                                                                   |
|  [Pass 1: Design Grammar]       Tokens, color clustering, typography rhythm       |
|  [Pass 2: Component Grammar]    Component boundaries, variants, and hierarchies   |
|  [Pass 3: Layout Grammar]       Flex/Grid relationships, alignment constraints    |
|  [Pass 4: Interaction Grammar]  Hover states, motion timelines, interactive graphs|
|  [Pass 5: Accessibility]        ARIA trees, semantic roles, contrast audits       |
|  [Pass 6: Reconstruction Plan]  Dependency graphs, layout planning, and packaging |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                    AI Clone Package (Compiled Target Output)                      |
|       Zero raw CSS bloat · Clean semantic models · 100% LLM-ready fidelity        |
+-----------------------------------------------------------------------------------+
```

---

## Core Engineering Capabilities

- **Deterministic Multi-Pass Compilation**: Implements `CompilerPass<TInput, TOutput>` passes orchestrated cleanly through a shared compilation context.
- **Strict DOM Decoupling**: Compiler logic operates strictly on the intermediate representation (`AgentDesignSpecification`), completely decoupled from live DOM handles or globals.
- **Semantic Compression**: Replaces deep repetitive DOM coordinate dumps with declarative design tokens, layout constraint systems, and typography scales without losing visual fidelity.
- **Component & Variant Recognition**: Identifies reusable component patterns, state variations, and containment hierarchies.
- **Fully Typed IPC Messaging**: Manifest V3 communication between popup controllers, background service workers, and content scripts with runtime validation.
- **Industrial Test Coverage**: Over **540+ automated unit and integration tests** passing across 60 test suites using Vitest.

---

## Technology Stack

- **Runtime & Platform**: Chromium Manifest V3 (Chrome, Edge, Brave)
- **Language**: TypeScript 5.7+ (strict mode, no implicit any)
- **Bundler & Build Tooling**: Vite 6, `tsc`
- **Testing & Quality**: Vitest 3, JSDOM, Puppeteer for real-browser end-to-end audit pipelines
- **Architecture**: Modular compiler design with Intermediate Representation (IR)

---

## Project Structure

```text
ui-ux-helper-extension/
├── src/
│   ├── compiler/                  # Multi-pass design compiler pipeline
│   │   ├── passes/                # Design, Component, Layout, and Motion passes
│   │   ├── context/               # CompilerContext & artifact generators
│   │   └── types/                 # Compiler schemas and intermediate contracts
│   ├── extraction/                # DOM traversal, layout bounds, style extraction
│   ├── normalization/             # Color, typography, and shape normalizers
│   ├── messaging/                 # Typed IPC protocols & message routers
│   ├── content/                   # In-page content script
│   ├── background/                # Manifest V3 service worker
│   └── popup/                     # Action popup UI controller & view
├── tests/                         # 60 test suites (540+ passing tests)
│   ├── compilerArchitecture.test.ts
│   ├── componentCompiler.test.ts
│   ├── layoutCompiler.test.ts
│   ├── multiSiteValidation.test.ts
│   └── ...
├── COMPILER_ARCHITECTURE.md       # Comprehensive architectural specification
├── manifest.json                  # Manifest V3 configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js `v18+` or `v22+`
- npm `v9+` or `v10+`

### Installation
```bash
npm install
```

### Type Checking
```bash
npm run typecheck
```

### Run Test Suite (540+ Tests)
```bash
npm test
```

### Build Extension Assets
```bash
npm run build
```

---

## Loading into Chromium Browsers

1. Run `npm run build` to compile the production bundle to `dist/`.
2. Open Chrome or Chromium and visit `chrome://extensions`.
3. Enable **Developer mode** via the toggle switch in the top right.
4. Click **Load unpacked** and select the root directory (or `dist/` directory depending on distribution mode).
