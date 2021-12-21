
#ifdef __atom__
 #warning "Arch Intel Atom"
 #define MAGIC_VALUE 2
#else
 #warning "Other arch"
 #define MAGIC_VALUE 1
#endif

int sum(int arr[], int len);
