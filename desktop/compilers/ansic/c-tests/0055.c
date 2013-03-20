void doItArray(char ptr[])
{
  printf("%s\n", ptr);
}

void doItPointer(char * ptr)
{
  printf("%s\n", ptr);
}

int main(int argc, char * argv[])
{
  char *          p = "hello world";
  
  printf("Should print 'hello world'\n");
  doItArray(p);
  printf("Should print 'hello world'\n");
  doItPointer(p);
  return 0;
}
