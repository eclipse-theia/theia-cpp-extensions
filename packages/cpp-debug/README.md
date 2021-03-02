# cpp-debug

This extension provides two major pieces of functionality. First, on the backend (in the `./src/node` folder), it registers the `launch` schemas
associated with the [cdt-gdb-vscode](https://github.com/eclipse-cdt/cdt-gdb-vscode) VS Code extension and sets up the infrastructure to run C/C++
those debug sessions using [GDB](https://www.gnu.org/software/gdb/). You can find a sample launch configuration in this repository's
`examples/cpp-debug-workspace/.theia/launch.json` file. Additional or alternative adapters can be used by adding bindings to
[the backend module](./src/node/cpp-debug-backend-module.ts) or by modifying code in the
[backend contribution](./src/node/cpp-debug-backend-contribution.ts)

Second, on the frontend (`./src/browser` folder), it provides a suite of widgets for viewing memory in different ways.

## The Frontend Widgets

### Memory Widget

The basic [`MemoryWidget` class](./src/browser/memory-widget/memory-widget.ts) is a wrapper around two functional widgets, a `MemoryOptionsWidget` and 
a`MemoryTableWidget`. The [`MemoryOptionsWidget`](./src/browser/memory-widget/memory-options-widget.tsx) is responsible for configuring the display
and fetching memory, and the [`MemoryTableWidget`](./src/browser/memory-widget/memory-table-widget.tsx) renders the memory according to the options
specified by the user in the `MemoryOptionsWidget`. The basic combination of these three classes offers variable highlighting, ascii display, and
dynamic updating in response to events from the debug session, as well as the option to lock the view to ignore changes from the session.

### Diff Widget

The [`MemoryDiffWidget`](./src/browser/diff-widget/memory-diff-widget-types.ts) is an elaboration of the `MemoryWidget` type that allows side-by-side
comparison of the contents of two `MemoryWidgets`.

### Register Widget

Although it is not supported by the `cdt-gdb-vscode` debug adapter, the Debug Adapter Protocol supports including registers as a scope inside the
response to a variables request. The [`RegisterWidget`](./src/browser/register-widget/register-widget-types.ts) offers functionality to view and
manipulate those values when using a debug adapter that reports register contents.

### Editable Widget

Another feature not presently available from `cdt-gdb-vscode` but
[proposed for the Debug Adapter Protocol](https://github.com/microsoft/debug-adapter-protocol/issues/163) and available for implementation as a custom
request to a GDB backend is direct writing of memory by address. The 
[`MemoryEditableTableWidget`](./src/browser/editable-widget/memory-editable-table-widget.tsx) adds UI functionality to allow users to modify values in
the table display and send them to a backend that supports that operation.

## Using the Widgets

The widgets are created by the [`MemoryWidgetManager`](./src/browser/utils/memory-widget-manager.ts), and modifying the `createNewMemoryWidget()`
method of that service allows you to change what kind of widget is instantiated and under what circumstances. The widgets get memory through the 
[`MemoryProvider`](./src/browser/memory-provider/memory-provider.ts), and that class can be modified or rebound so suit the needs of different debug
adapters.
