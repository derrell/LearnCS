int main(int argc, char * argv[])
{
    int             i = 3;

    printf("Should only print 'found case 3'\n");
    switch(i)
    {
    case 0:
        printf("found case 0\n");
        break;

    case 2:
        printf("found case 2\n");
        break;
        
    case 3:
        printf("found case 3\n");
        break;

    case 4:
        printf("found case 4\n");
        break;

    default:
        printf("default\n");
        break;
    }

    printf("Should print 'found case 3' followed by 'found case 4'\n");
    switch(i)
    {
    case 0:
        printf("found case 0\n");
        break;

    case 2:
        printf("found case 2\n");
        break;
        
    case 3:
        printf("found case 3\n");

    case 4:
        printf("found case 4\n");
        break;

    default:
        printf("default\n");
        break;
    }

    printf("Should print only 'default'\n");
    switch(13)
    {
    case 0:
        printf("found case 0\n");
        break;

    case 2:
        printf("found case 2\n");
        break;
        
    case 3:
        printf("found case 3\n");

    case 4:
        printf("found case 4\n");
        break;

    default:
        printf("default\n");
        break;
    }

    printf("Should print 'found case 4' followed by 'default'\n");
    switch(4)
    {
    case 0:
        printf("found case 0\n");
        break;

    case 2:
        printf("found case 2\n");
        break;
        
    case 3:
        printf("found case 3\n");

    case 4:
        printf("found case 4\n");

    default:
        printf("default\n");
        break;
    }
    

}
