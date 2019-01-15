This extension contributes debugging support to Theia for C/C++ using
[GDB](https://www.gnu.org/software/gdb/) through the
[cdt-gdb-vscode](https://github.com/eclipse-cdt/cdt-gdb-vscode) debug adapter.

Here's how a simple debug launch config in `.theia/launch.json` may look like:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "nngcat",
      "type": "gdb",
      "request": "launch",
      "program": "/home/emaisin/build/nng/tools/nngcat/nngcat",
      "logFile": "/tmp/gdb.log"
    },
  ]
}
```
