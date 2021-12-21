#include "lib.h"

int sum(int arr[], int len) {
    int result = 0;
    for (int i = 0 ; i < len; i++) {
        result += arr[i];
    }
    return result + MAGIC_VALUE;
}
