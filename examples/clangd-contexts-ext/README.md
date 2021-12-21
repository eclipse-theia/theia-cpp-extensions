# theia-clangd-contexts-ext

## Overview

An example application of the _Clangd Contexts API_, in the form of a simple VS Code extension.
The extension maps the _context_ concept of the API onto the notion of _build configuration_ (or _build target_) familiar from IDEs such as Apple Xcode or Eclipse CDT.

## Features

-   quickly and easily apply clangd contexts described by `compile_commands.json` files to projects in the workspace
-   configure clangd's invocation of `clang` to suppress GCC flags such as `-fstack-usage` that are not recognized by clang

## How to Run the Example VS Code Extension

The most convenient way to run the extension with debugger support for stepping through the code is via the _Launch Clangd Contexts Example Extension_ launch configuration in VS Code.
The run-time workbench then provides

-   a build configuration selection widget in the status line
-   a context menu action on folders in the _Explorer_ view to configure GCC flags to suppress in the clangd configuration

The launch configuration opens a VS Code run-time workbench on the example workspace (see below).

Alternatively, the extension is built and packaged also in the browser and Electron example applications.
These example apps can be launched on the _clangd contexts_ example workspace as follows:

```console
# for the clangd example workspace opened in the browser
$ yarn start:browser:clangd
# for the clangd example workspace opened in the Electron deployment
$ yarn start:electron:clangd
```

## Using the Example VS Code Extension

The [example workspace](../clangd-workspace/README.md) contains two projects, `app/` and `lib/`.
If we have a look at the `app/main.c` file we can see a compilation error because the reference to a name defined in the `lib/` project cannot be resolved.
To fix this a build configuration needs to be set.

> **Note** that until the example workspace has first been built [according to these instructions](../clangd-workspace/README.md#how-to-build-the-workspace), VS Code will not be able to show any build configurations to choose because the context directories containing the requisite makefiles and compilation databases do not yet exist.

This can be done via the command palette using the `Clangd: Change build configuration` command.
Alternatively, the build configuration can be configured by clicking on the build configuration item on the status bar.

> **Note** that the `Clangd: Change build configuration` command also restarts the clangd language server to apply the configuration changes.
> Some errors regarding rejected promises may be thrown by restarting the language server.
> However, they are harmless and can safely be ignored.

Clangd uses a dedicated cache per build configuration index, which means that switching between configurations does not require a full re-indexing.

The `Debug_x86-64` configuration uses a GCC-specific compile flag which is not recognized by clangd.
To avoid errors related to unsupported GCC compile flags the `Clangd: Suppress unsupported GCC flags"` command can be used.
It is also possible to suppress GCC flags only in a specific subdirectory.
Simply select the directory in the file explorer, open the context menu and select `Clangd: Suppress unsupported GCC flags"`.
The `theia-clangd-contexts-ext` extension then recursively collects all `.clangd` configuration files that are located within the workspace or within the selected directory and adds a configuration option that tells the clangd server to suppress the unsupported compilation flags.

## Example Workspaces

-   [`examples/clangd-workspace`](../clangd-workspace/README.md)
    -   provides a small example workspace with two interrelated projects in which to test-drive the _Clangd Contexts_ API via the extension

## License

-   [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
-   [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## Trademark

"Theia" is a trademark of the Eclipse Foundation.  
<https://www.eclipse.org/theia>
