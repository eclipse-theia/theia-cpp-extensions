cmake_minimum_required (VERSION 2.6)
project (Program1)

include_directories ("${PROJECT_BINARY_DIR}")
include_directories ("${PROJECT_SOURCE_DIR}/lib1")

add_executable (Program1 a.cpp)
