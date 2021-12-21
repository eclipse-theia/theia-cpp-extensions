# @theia/clangd-contexts

## Overview

An API for management of [clangd](https://clangd.llvm.org) configuration files in C/C++ projects using _contexts_.
A _context_ is the set of flags, parameters, other settings and source files that clangd uses as input.
Currently, this library is limited to configuring the compilation database (`compile_commands.json` file) and compile flags in the `.clangd` file for a project.
Contexts are identified via the names of the directories containing `compile_commands.json` files.
In the future additional settings may be associated with a specific context, for example the handling of additional or removed compilation flags (currently these are managed on an _ad hoc_ basis).

## Features

-   API for management of [clangd](https://clangd.llvm.org) configuration files
-   retrieve and set contexts in one or more `.clangd` files
-   manage compile flags in `.clangd` files

The API in the `clangd-config` and `clangd-context` modules manages the `CompileFlags` configuration of _clangd_ in the `.clangd` files in a C/C++ project.
In particular,

-   which `CompilationDatabase` to use, referencing a `compile_commands.json` file
-   any compiler flags to `Remove` from or `Add` to those specified in the compilation database when invoking `clang`

The API establishes two core concepts: a _project_ that is configured via a `.clangd` file and a _context_ that identifies a compilation database (a particular `compile_commands.json` file).
A context's name is inferred from the name of the directory that contains the compilation database file.
A workspace may have one or more projects each configured with a `.clangd` file for different subtrees.
Each project has one or more contexts and in a multi-project workspace the projects' context names may overlap to any degree.
The [example workspace](../../examples/clangd-workspace/README.md) shows a fairly small example of how this can be laid out:

```plain
workspace/                           // a multi-project workspace
  +-- app/                           // a project
  |   +-- Debug_x86-64/              // a "Debug mode for x86-64 architecture" context
  |   |   +-- compile_commands.json  // the context's compilation database
  |   |   +-- Makefile
  |   |   +-- ...
  |   +-- Release_Atom/              // a "Release mode for Atom architecture" context
  |   |   +-- compile_commands.json
  |   |   +-- ...
  |   +-- .clangd                    // the clangd configuration for the "app" project
  +-- lib/                           // another project
      +-- Debug_x86-64/              // similar context as in the "app" project
      |   +-- compile_commands.json
      |   +-- ...
      +-- Release_Atom/              // similar context as in the "app" project
      |   +-- compile_commands.json
      |   +-- ...
      +-- .clangd                    // the clangd configuration for the "lib" project
```

The core API for the `.clangd` configuration file does not assume any particular directory structure: client applications specify contexts to set into the `.clangd` file either by path to the `compile_commands.json` file or the directory containing it.
The inferred name of the context, which is useful primarily for presentation to the user in a UI or command-line tool, is the path name of the parent directory of the `compile_commands.json` file relative to the `.clangd` file for the project.
So, in the example above, the context names in both projects are "Debug_x86-64" and "Release_Atom".

Another API in the `clangd-contexts-config` module is provided to help clients discover existing projects and contexts of a workspace that is configured with an optional `.clangd-contexts` file that describes the layout of the workspace.
A workspace may have one of these at the root or may have several `.clangd-contexts` files in different subtrees.
A `.clangd-contexts` file enumerates the project directories in its scope and, for each, indicates whether context directories are organized in a flat list as in the example above or hierarchically as in the structure below:

```plain
workspace/                           // a multi-project workspace
  +-- app/                           // a project directory
  |   +-- Debug/                     // "Debug mode" contexts
  |   |   +-- x86-64/                // the "Debug mode" context for x86-64 architecture
  |   |   |   +-- compile_commands.json
  |   |   |   +-- Makefile
  |   |   |   +-- ...
  |   |   +-- Atom/                  // the "Debug mode" context for Atom architecture
  |   |   |   +-- compile_commands.json
  |   |   |   +-- Makefile
  |   |   |   +-- ...
  |   |   +-- Makefile
  |   |   +-- ...
  |   +-- Release/                   // "Release mode" contexts
  |   |   +-- x86-64/                // the "Release mode" context for x86-64 architecture
  |   |   |   +-- compile_commands.json
  |   |   |   +-- Makefile
  |   |   |   +-- ...
  |   |   +-- Atom/                  // the "Release mode" context for Atom architecture
  |   |   |   +-- compile_commands.json
  |   |   |   +-- Makefile
  |   |   |   +-- ...
  |   |   +-- Makefile
  |   |   +-- ...
  |   +-- .clangd                    // the clangd configuration for the "app" project
  +-- lib/                           // another project directory
  |   +-- Debug/                     // similar context as in the "app" project
  |   |   +-- x86-64/
  |   |   +-- Atom/
  |   |   +-- ...
  |   +-- Release/                   // similar context as in the "app" project
  |   |   +-- x86-64/
  |   |   +-- Atom/
  |   |   +-- ...
  |   +-- .clangd                    // the clangd configuration for the "lib" project
  +-- .clangd-contexts               // configuration of project layout in the workspace
```

The API around the `.clangd-contexts` configuration file provides functions for querying what are the configured project directories and what are the
distinct context names available across all of those projects.
In this layout, the distinct context names are "Debug/x86-64", "Debug/Atom", "Release/x86-64", and "Release/Atom".

Currently, the `.clangd-contexts` file is limited to describing the shape of projects in the clangd workspace.
A future enhancement should expand the configuration in this file to include lists of added/removed compile flags on a per project basis and, optionally, per context as well, allowing the `setContext` and `selectContext` APIs to update the added/removed compile flags in the `.clangd` configuration automatically on context switch.

## Example Workspaces

-   [`examples/clangd-workspace`](../../examples/clangd-workspace/README.md)
    -   provides a small example workspace with two interrelated projects in which to test drive the API via the [VS Code Extension example](../../examples/clangd-contexts-ext/README.md) and/or the [CLI Example](../../examples/clangd-contexts-cli/README.md)

## License

-   [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
-   [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## Trademark

"Theia" is a trademark of the Eclipse Foundation.  
<https://www.eclipse.org/theia>
