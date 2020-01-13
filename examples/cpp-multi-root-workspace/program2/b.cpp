// A simple program that computes the square root of a number
#include "b.h"
#include <cmath>
#include <cstdio>
#include <cstdlib>

int main(int argc, char *argv[]) {
  if (argc < MEH) {
    fprintf(stdout, "2 Usage: %s number\n", argv[0]);
    return 1;
  }
  double inputValue = atof(argv[1]);
  double outputValue = sqrt(inputValue);
  fprintf(stdout, "2 The square root of %g is %g\n", inputValue, outputValue);
  return 0;
}
