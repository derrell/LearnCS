typedef int *   IntPtr;
IntPtr          pInt;
int             universe[2] = { 42, 23 };

const int       NUM = 4;

struct Data1
{
    int             i;
    char            c;
    IntPtr          pInt;
} data, *pData;
typedef struct Data1 Data_t;

struct Data1 data1;

typedef struct Data2
{
    int             i;
    char            c;
} Data2;
