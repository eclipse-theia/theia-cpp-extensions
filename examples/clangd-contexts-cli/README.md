# @theia/clangd-contexts-cli

## Overview

A CLI tool for management of [clangd](https://clangd.llvm.org) configuration files in C/C++ projects.

## Features

-   identify multiple different projects in a C/C++ workspace edited with clangd support
-   quickly and easily apply clangd contexts, described by `compile_commands.json` files, to projects
-   customize the invocation of `clang` by clangd on a per project basis to account for differences between `clang` and the project's C/C++ toolchain

## CLI Usage

The _clangd contexts_ CLI application provides several commands to interact with the context API.
It can be used to set the clangd context for a given project directory and retrieve the clangd context for a given project.
In addition, the CLI provides commands to change the set of compilation flags that should be considered by the clangd server for a given project configuration (`.clangd` file).

> **Note** that in order to run the `clangd-context` CLI tool as shown in these snippets, you need to link the `@theia/clangd-contexts-cli` package with "`yarn link`".

Once the `clangd-contexts` project has been built and the CLI linked as described in the [root README file](../../README.md#how-to-build), the command is available to execute in a VScode terminal as shown here.
The main help output of the CLI application looks like this:

```console
$ clangd-context
Usage: clangd-context [options] [command]

Options:
  -h, --help      display help for command

Commands:
  get-context     get the context in a project configuration
  set-context     set or change the context in a project configuration
  list            list the projects in the clangd workspace
  list-contexts   list the contexts of the projects in the clangd workspace
  select-context  select a context to activate in every project in the workspace
  set-flags       set added/removed compile flags in a project
  unset-flags     unset added/removed compile flags in a project
  help [command]  display help for command
```

The `select-contexts` command requires knowledge of what the clangd contexts in the current workspace scope are.
This scope is defined by an optional `.clangd-contexts` file.

### Workspace Clangd Contexts Configuration

A workspace may optionally provide a `.clangd-contexts` file that tells the CLI the layout of projects in the workspace.
It indicates which directories comprise projects, configured by `.clangd` files and how to find context directories containing the `compile_commands.json` files in each project.
A workspace may contain any number of `.clangd-contexts` files that each describe the layout of their distinct subtree.

The `.clangd-contexts` file is a JSON object that looks like this example from the [Example Clangd Contexts Workspace](../clangd-workspace/README.md):

```json
{
    "workspaceName": "Theia Clangd Contexts Example",
    "projects": [
        {
            "path": "app",
            "contextDirs": "flat"
        },
        {
            "path": "lib",
            "contextDirs": "flat"
        }
    ]
}
```

An optional name identifies the workspace but is not used by the CLI. The list of clangd `projects` specifies for each:

-   the path to the project directory, relative to the workspace root (which is the directory containing the `.clangd-contexts` file). This directory must contain the context directories (and therefore the `compile_commands.json` files) but is not required to contain the source files
-   the shape of context directories in the context, either `"flat"` or `"nested"`. This tells the CLI how to search for the `compile_commands.json` files that describe each context and how to derive context names
    -   in the flat scheme, the context name is just the name of the directory containing the `compile_commands.json` file
    -   in the nested scheme, the context name is the slash-separated path of the directory containing the `compile_commands.json` file, relative to the project directory

For commands that use this workspace configuration file, the CLI searches up the directory hierarchy from the current working directory.
The workspace scope is the directory tree rooted in the directory in which the `.clangd-contexts` file is found.

### Getting a Context

If you haven't already, prepare the `clangd-workspace` example workspace by [building it](../clangd-workspace/README.md#how-to-build-the-workspace).

First retrieve the current context configuration of the `app` project.
This can be done with the `get-context` command.
This command takes the location of a `.clangd` configuration file or its parent directory as input.
There should not be any `.clangd` file in the `app/` directory yet so the expected output is:

```console
$ clangd-context get-context app
{ name: 'NO_CONTEXT', compilationDatabase: '' }
```

### Setting a Context

Next, set the active clangd context.
The `app/` and `lib/` projects both contain two contexts `Debug_x86-64` and `Release_Atom`.
Set a context with the `set-context` command.
As for the `get-context` command, the main argument is the location of the `.clangd` configuration file or its parent directory.
It is also necessary to specify the compilation database (`compile_commands.json` file or its parent directory) to identify the context to set in the project.
This is done with the `--compile-commands` (`-c`) option:

```console
clangd-context set-context -c app/Debug_x86-64 app
```

Now the `app/` directory should contain a new `.clangd` file with the following contents:

```yaml
CompileFlags:
    CompilationDatabase: /home/me/git/theia-cpp-extensions/examples/clangd-workspace/app/Debug_x86-64
```

Upon executing the previous `get-context` command again, the output should be as follows:

```console
$ clangd-context get-context app
{
  name: 'Debug_x86-64',
  compilationDatabase: '/home/me/git/theia-cpp-extensions/examples/clangd-workspace/app/Debug_x86-64'
}
```

With this configuration file the clangd server now has all of the information it needs to provide language support for the `Debug_x86-64` context.

### Listing the Projects in the Workspace

For workspaces that are configured with a `.clangd-contexts` file, the CLI supports an additional command `list` that lists the configured projects.
For example, executing the following command in the example workspace:

```console
$ clangd-context list
app/
lib/
```

results in the paths of existing clangd contexts being displayed relative to the current working directory.

### Listing the Clangd Contexts in the Workspace

For workspaces that are configured with a `.clangd-contexts` file, the CLI supports an additional command `list-contexts` that lists the available context names across all projects in the workspace.
For example, executing the following command in the example workspace:

```console
$ clangd-context list-contexts
Debug_x86-64
Release_Atom
```

shows that across all projects in the workspace, the unique context names are `Debug_x86-64` and `Release_Atom`.

### Selecting a Context for the Workspace

For workspaces that are configured with a `.clangd-contexts` file, the CLI supports an additional command `select-context` that activates a named context in all projects that have a context of that name.
For example, executing the following command:

```console
clangd-context select-context Release_Atom
```

results in all of the context directories listed in the `.clangd-context` file having the build configuration "Release_Atom" applied to their `.clangd` file, if they have a "Release_Atom" configuration.
In the example project, following up with a `get-context` command would look something like this:

```console
$ clangd-context get-context lib
{
  name: 'Release_Atom',
  compilationDatabase: '/home/me/git/theia-cpp-extensions/examples/clangd-workspace/lib/Release_Atom'
}
```

Projects that do not have the named context are unchanged.
If the context name is not known in any project in the workspace, then the CLI exits with an error.

### Changing Compile Flags

In addition to getting and setting the context, the CLI provides commands for setting the compile flags that are evaluated by the clangd server.
This is done with the `set-flags` and `unset-flags` commands.
As usual the main argument is the location of the `.clangd` configuration file or its parent directory.

#### Setting Compile Flags to be Added or Removed

The `set-flags` command updates the `.clangd` configuration to specify flags that the language server should add to or remove from its invocations of the compiler.

With the `--add` (`-a`) option the set of flags that should be added to those already specified in the compilation database can be configured.
The `--remove` (`-r`) option sets which flags in the compilation database should be suppressed in the language server's invocation of the compiler.

A command that tells the clangd server to suppress the `-fstack-usage` flag looks like this:

```console
clangd-context set-flags -r fstack-usage app
```

> **Note** that the command line here names the `-fstack-usage` compiler flag simply as "fstack-usage" without the initial "-". This is necessary because otherwise it would be interpreted as a command-line option for the `clangd-context` tool, itself. Multiple compiler flags can be added or removed at once by specifying them in a comma-separated list in the `-a` or `-r` option.

The resulting `.clangd` file for the `Release_Atom` context in the `app` project looks like this:

```yaml
CompileFlags:
    CompilationDatabase: >-
        /home/me/git/theia-cpp-extensions/examples/clangd-workspace/app/Release_Atom
    Remove:
        - "-fstack-usage"
```

The project name argument ("`app`" in the example above) is optional if the workspace is configured with a `.clangd-contexts` file.
In this case, omitting the project name applies the compile flags change to all projects listed in the `.clangd-contexts` file.

#### Forgetting Configuration of Compile Flags

To reverse previous additions or removals of compiler flags in the `.clangd` configuration, use the `unset-flags` command.
This deletes occurrences of flags so that they are no longer added or removed from compiler command-lines by the language
server, depending on the previous configuration.

A command that tells the clangd server not to override the usage of the `-fstack-usage` flag in the compiler command looks like this:

```console
clangd-context unset-flags -f fstack-usage app
```

> **Note** that, as for the `set-flags` command, at least the first flag of the comma-separated list in the `-f` option must omit the initial "-".

The resulting `.clangd` file for the `Release_Atom` context in the `app` project then is reverted to this:

```yaml
CompileFlags:
    CompilationDatabase: >-
        /home/me/git/theia-cpp-extensions/examples/clangd-workspace/app/Release_Atom
```

The project name argument ("`app`" in the example above) is optional if the workspace is configured with a `.clangd-contexts` file.
In this case, omitting the project name applies the compile flags change to all projects listed in the `.clangd-contexts` file.

## Example Workspaces

-   [`examples/clangd-workspace`](../clangd-workspace/README.md)
    -   provides a small example project with two interrelated projects in which to test drive the CLI tool

## License

-   [Eclipse Public License 2.0](http://www.eclipse.org/legal/epl-2.0/)
-   [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](https://projects.eclipse.org/license/secondary-gpl-2.0-cp)

## Trademark

"Theia" is a trademark of the Eclipse Foundation.  
<https://www.eclipse.org/theia>
