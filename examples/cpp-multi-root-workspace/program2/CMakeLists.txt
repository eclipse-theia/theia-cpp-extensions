cmake_minimum_required (VERSION 2.6)
project (Program2)

include_directories ("${PROJECT_BINARY_DIR}")
include_directories ("${PROJECT_SOURCE_DIR}/lib2")

add_executable (Program2 b.cpp)
