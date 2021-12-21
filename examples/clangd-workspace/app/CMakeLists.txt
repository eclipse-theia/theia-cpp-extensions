cmake_minimum_required(VERSION 3.5)
set(CMAKE_SYSTEM_PROCESSOR x86-64)
set(CMAKE_C_COMPILER_ID GNU)
set(CMAKE_CXX_COMPILER_ID GNU)
set(CMAKE_C_COMPILER_FORCED TRUE)
set(CMAKE_CXX_COMPILER_FORCED TRUE)
set(CMAKE_C_COMPILER gcc)
set(CMAKE_CXX_COMPILER g++)

project(cmake1)
set(CMAKE_EXPORT_COMPILE_COMMANDS TRUE)
set(TARGET_FLAGS "-Wconversion ${EXT_FLAGS}")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${TARGET_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${TARGET_FLAGS}")

set(source_files
    file_1.c
    file_2.c
    file_3.c
    main.c
)

include_directories(
    ../lib
)

link_libraries(-L../../lib/${LIBNAME} -l${LIBNAME})
add_executable(cmake1 ${source_files})
