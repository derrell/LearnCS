typedef int *   IntPtr;
IntPtr          pInt;
int             universe[2] = { 42, 23 };
struct Data
{
    int             i;
    char            c;
    IntPtr          pInt;
} data, *pData;
typedef struct Data Data_t;
