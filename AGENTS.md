# Nevernote Implementation

This project implements the Meliora Testlab demo application: Nevernote App.

## Specification guidelines

Specifications on what the App does are documented in Testlab ALM via MCP ("testlab").

The principle:

- AGENTS.md (this file): HOW to work (tools, commands, workflow instructions, ...)
- Specification in Testlab ALM: WHAT to build (business requirements, App logic, UI wireframes, Look and feel, high-level non-functional requirements)

### Accessing the specification

Use "testlab" mcp server to access project with projectKey "NN".

### Conventions on the specification

- Use "get_requirement_tree" tool to understand the specification as a whole
- Requirements in the specification are identified with requirementId, have a descriptive name and detailed HTML-based description as content.
- A single requirement is a chapter in specification document so even folders may have a description.
- Requirements may be targeted to milestones for implementation.
- High-level features to be implemented are in sub-folders under "F - Features". When a developers reference a Feature it most-likely means a Feature in this folder.

### UI design documentation

- Views are designed in Figma and available as Views in the specification
- Views include a (human-readable) PNG file that acts as a mockup of the layout and a semantic (machine-readable) .json export

## Code conventions

- Fetch requirement "CC - Code conventions" for code conventions

## Getting started

1. Fetch requirement tree to get overall understanding of the specification
2. Fetch requirements under "T - Technical" to get understanding on technical architecture, preferred stack, et al.
3. Fetch mockups of the views under "V - Views" when referenced or otherwise needed

## Library versions

- Peek "STACK - Technology stack" for preferred library versions
- When adding a new dependency to the project try to find the latest stable version via npmjs.com

## Workflow

- Always, before implementing or planning anything, use get_requirement_tree tool to inspect the specification as a whole and read, analyze and apply the specification as a developer would
- Before implementing or planning something, refresh the relevant requirements from ALM as they might have been edited
- Fetch requirement "GL - Glossary and terminology" for domain terminology
- Follow code conventions for all code
- Prefer the technology stack and follow technical guidelines documented under "T - Technical" folder
- Before implementing any substantial changes, propose a plan of changes and proceed after user review
