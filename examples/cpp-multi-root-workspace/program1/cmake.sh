#!/bin/sh

SOURCE_DIR="$(readlink -f "$(dirname "$0")")"
BUILD_DIR="/tmp/build/theia-cpp-test/program1"
mkdir -p $BUILD_DIR
cd $BUILD_DIR
cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=1 -G "Unix Makefiles" "$SOURCE_DIR/$PROGRAM"
