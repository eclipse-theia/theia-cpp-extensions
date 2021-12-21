# Example Workspace with Clangd Contexts

This is a simple multi-project workspace that has two different _clangd contexts_ that should be properly handled by code completion suggestions and warnings in the code editor.

## How to Open the Workspace

The monorepo provides two scripts that open the example workspace in either the browser or the Electron deployment of Theia:

```console
# to build the example apps
$ yarn
# for the browser example
$ yarn start:browser:clangd
# for the Electron example
$ yarn start:electron:clangd
```

## How to Build the Workspace

Make sure that you have `gcc` from the GNU toolchain and `cmake` on the `PATH`.
Then build the workspace using

```console
./build.sh
```

It will build the `CMakeLists.txt` in two flavors, for two different architectures, each with its own `compile_commands.json`:

```text
  app/
    Debug_x86-64/
    Release_Atom/
  lib/
    Debug_x86-64/
    Release_Atom/
```

This is interesting because the built-in defined symbols differ.
In `main.c` there are different warnings depending on the built-in defined symbols and the definition of the `TestStruct_t` is different depending on the target architecture.

Line 22 will generate a warning in the `Atom` configurations, but not in the others because in those, the `__atom__` macro is not defined (not being built specifically for that CPU).

## Context-sensitive Variation Points

### Context

The example workspace comprises two projects (`lib/` and `app/`) that each have potentially four different contexts on a 2x2 matrix of debug or release mode for generic x86-64 or Intel Atom CPU architectures.
These contexts collect their makefiles and `compile_commands.json` files in a flat directory structure within each project:

```text
  app/
    Debug_x86-64/
    Release_Atom/
  lib/
    Debug_x86-64/
    Release_Atom/
```

### Header Files

Setting the context to use in the project lets clangd resolve header files correctly:

-   open header files show information based on built-in defined symbols and "generic project-wide" compilation flags used for every file in the project
    -   e.g. `-march=x86-64` vs `-march=atom` compiler flags yield different `#ifdef __atom__` conditional compilation

### GCC Flags Filtering

The compilation commands in the `compile_commands.json` databases of some build configurations can include flags supported by GCC that the clang toolchain used by clangd does not understand.
The clangd configuration can specify flags that should be suppressed in the invocation of the clang compiler:

-   e.g. `-fstack-usage` is a GCC flag used when compiling that yields an error for `clangd` because it is not supported by the clang compiler
-   remove/filter GCC-specific flags to be clang compatible to avoid false errors for things that don't really matter for indexing
-   add clang-specific flags as necessary to support clangd's analysis of the code

> **Note** that on Mac platform, the `gcc` compiler provided by Xcode is actually based on `clang`, and so building the project via `build.sh` will also show the unrecognized `-fstack-usage` flag errors.
> These can be ignored for the purposes of the example.
