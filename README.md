<div align='center'>
<br />
<img src='./logo/theia.svg' alt='theia logo' width='125'>

<h2>ECLIPSE THEIA - C/C++ EXTENSIONS</h2>

</div>

## Overview
Collection of Theia extensions related to C/C++ development.

## Features
- `@theia/cortex-debug`:
   - Debugging support for ARM Cortex-M Microcontrollers.
- `@theia/cpp-debug`:
   - Debugging support using `GDB` through the `cdt-gdb-vscode` extension.
   - Memory view (monitor process memory during debug sessions).

## How to build
The `browser-app` and `electron-app` directories contain examples of Theia-based applications which use the extensions
provided by the repository.

- `browser-app` build instructions:
  ```bash
  $ yarn
  $ yarn rebuild:browser
  $ cd browser-app && yarn start
  ```

- `electron-app` build instructions:
   ```bash
   $ yarn
   $ yarn rebuild:electron
   $ cd electron-app && yarn start
   ```

## Example Workspaces
- [`cpp-debug-workspace`](./examples/cpp-debug-workspace/README.md)
    - provides an easy and reproducible way to test the functionality present in the `@theia/cpp-debug` extension. Includes a simple C/C++ program, debug launch configuration file (`launch.json`), and a task in order to compile the program (`tasks.json`).

## License

- [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## Trademark
"Theia" is a trademark of the Eclipse Foundation
https://www.eclipse.org/theia
