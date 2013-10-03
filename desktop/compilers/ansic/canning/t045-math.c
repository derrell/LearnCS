#include <stdio.h>
#include <math.h>

#pragma debug:math=0

int main(int argc, char * argv[])
{
    double          d;

    printf("acos(-1.1) = %f\n", acos(-1.1));
    printf("acos(-1.0) = %f\n", acos(-1.0));
    printf("acos(0.0)  = %f\n", acos(0.0));
    printf("acos(1.0)  = %f\n", acos(1.0));
    printf("acos(1.1)  = %f\n", acos(1.1));
    printf("\n");

    printf("asin(-1.1) = %f\n", asin(-1.1));
    printf("asin(-1.0) = %f\n", asin(-1.0));
    printf("asin(0.0)  = %f\n", asin(0.0));
    printf("asin(1.0)  = %f\n", asin(1.0));
    printf("asin(1.1)  = %f\n", asin(1.1));
    printf("\n");

    printf("atan(-1.1) = %f\n", atan(-1.1));
    printf("atan(-1.0) = %f\n", atan(-1.0));
    printf("atan(0.0)  = %f\n", atan(0.0));
    printf("atan(1.0)  = %f\n", atan(1.0));
    printf("atan(1.1)  = %f\n", atan(1.1));
    printf("\n");

    printf("ceil(0.5)  = %f\n", ceil(0.5));
    printf("ceil(-0.5) = %f\n", ceil(-0.5));
    printf("\n");

    printf("cos(-PI * 3)   = %f\n", cos(-M_PI * 3));
    printf("cos(-PI * 2.5) = %f\n", cos(-M_PI * 2.5));
    printf("cos(-PI * 2)   = %f\n", cos(-M_PI * 2));
    printf("cos(-PI * 1.5) = %f\n", cos(-M_PI * 1.5));
    printf("cos(-PI * 1)   = %f\n", cos(-M_PI * 1));
    printf("cos(-PI * 0.5) = %f\n", cos(-M_PI * 0.5));
    printf("cos(-PI * 0.2) = %f\n", cos(-M_PI * 0.2));
    printf("cos(PI * 0)    = %f\n", cos(M_PI * 0));
    printf("cos(PI * 0.2)  = %f\n", cos(-M_PI * 0.2));
    printf("cos(PI * 0.5)  = %f\n", cos(M_PI * 0.5));
    printf("cos(PI * 1)    = %f\n", cos(M_PI * 1));
    printf("cos(PI * 1.5)  = %f\n", cos(M_PI * 1.5));
    printf("cos(PI * 2)    = %f\n", cos(M_PI * 2));
    printf("cos(PI * 2.5)  = %f\n", cos(M_PI * 2.5));
    printf("cos(PI * 3)    = %f\n", cos(M_PI * 3));
    printf("\n");

    printf("exp(-2.0)  = %f\n", exp(-1.0));
    printf("exp(-1.0)  = %f\n", exp(-1.0));
    printf("exp(-0.5)  = %f\n", exp(-0.5));
    printf("exp(0.0)   = %f\n", exp(0.0));
    printf("exp(0.5)   = %f\n", exp(0.5));
    printf("exp(1.0)   = %f\n", exp(1.0));
    printf("exp(2.0)   = %f\n", exp(2.0));
    printf("\n");

    printf("fabs(NAN)  = %f\n", fabs(NAN));
    printf("fabs(-0.5) = %f\n", fabs(-0.5));
    printf("fabs(0.0)  = %f\n", fabs(0));
    printf("fabs(0.5)  = %f\n", fabs(0.5));
    printf("\n");

    printf("floor(NAN)        = %f\n", floor(NAN));
    printf("floor(-1.9999999) = %f\n", floor(-1.9999999));
    printf("floor(-1.51)      = %f\n", floor(-1.51));
    printf("floor(-1.50)      = %f\n", floor(-1.50));
    printf("floor(-1.0000001) = %f\n", floor(-1.0000001));
    printf("floor(1.0000001)  = %f\n", floor(1.0000001));
    printf("floor(1.50)       = %f\n", floor(1.50));
    printf("floor(1.51)       = %f\n", floor(1.51));
    printf("floor(1.9999999)  = %f\n", floor(1.9999999));
    printf("\n");

    printf("labs(-999999L) = %f\n", labs(-999999L));
    printf("labs(0L)       = %f\n", labs(0L));
    printf("labs(999999L)  = %f\n", labs(999999L));
    printf("\n");

    return 0;
}
