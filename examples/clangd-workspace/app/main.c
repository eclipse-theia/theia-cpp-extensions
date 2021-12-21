#include "files.h"
#include <lib.h>

#ifdef __atom__
 #warning "Arch Intel Atom"
 typedef struct {
     int a;
 } TestStruct_t;
#else
 #warning "Other arch"
  typedef struct {
     float a;
 } TestStruct_t;
#endif

volatile float global_value = 1.234f;

int main() {
    int arr[4] = {1, 2, 3, 4};

    TestStruct_t obj;
    obj.a = global_value + ((float)sum(arr, 4));
    return 0;
}
