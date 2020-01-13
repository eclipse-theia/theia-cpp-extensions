## Eclipse Theia - Multiple-Root Example Workspace

---

### Description

This workspace provides an easy and reproducible way to test multiple-root functionality provided by the `@theia/cpp` extension.
The directory includes:
- An example `example.theia-workspace` file describing the different roots of the workspace and is used as the workspace itself.
- Two root folders:
    - `program1`
    - `program2`

### Use Cases

**Testing the multiple-root functionality**

1. open the file `example.theia-workspace` as a workspace.
2. for each root (`program1` and `program2`) run the shell script `./cmake.sh`.
3. open the files `a.cpp` and `b.cpp`.
4. set the `build configurations` for each root, namely `a` for `program1` and `b` for `program2` from the statusbar item.
5. verify that each file correctly resolves imports.
