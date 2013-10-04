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

    printf("log(NAN)   = %f\n", log(NAN));
    printf("log(10)    = %f\n", log(10));
    printf("log(100)   = %f\n", log(100));
    printf("log(10000) = %f\n", log(10000));
    printf("log(6)     = %f\n", log(6));
    printf("log(M_PI)  = %f\n", log(M_PI));
    printf("\n");
    
    printf("log2(NAN)   = %f\n", log2(NAN));
    printf("log2(10)    = %f\n", log2(10));
    printf("log2(100)   = %f\n", log2(100));
    printf("log2(10000) = %f\n", log2(10000));
    printf("log2(6)     = %f\n", log2(6));
    printf("log2(M_PI)  = %f\n", log2(M_PI));
    printf("\n");
    
    printf("log10(NAN)   = %f\n", log10(NAN));
    printf("log10(10)    = %f\n", log10(10));
    printf("log10(100)   = %f\n", log10(100));
    printf("log10(10000) = %f\n", log10(10000));
    printf("log10(6)     = %f\n", log10(6));
    printf("log10(M_PI)  = %f\n", log10(M_PI));
    printf("\n");
    
    printf("pow(NAN, 1)   = %f\n", pow(NAN, 1));
    printf("pow(10, 2)    = %f\n", pow(10, 2));
    printf("pow(10, 0.25) = %f\n", pow(10, 0.25));
    printf("pow(16, 0.5)  = %f\n", pow(16, 0.5));
    printf("\n");

    printf("sin(-PI * 3)   = %f\n", sin(-M_PI * 3));
    printf("sin(-PI * 2.5) = %f\n", sin(-M_PI * 2.5));
    printf("sin(-PI * 2)   = %f\n", sin(-M_PI * 2));
    printf("sin(-PI * 1.5) = %f\n", sin(-M_PI * 1.5));
    printf("sin(-PI * 1)   = %f\n", sin(-M_PI * 1));
    printf("sin(-PI * 0.5) = %f\n", sin(-M_PI * 0.5));
    printf("sin(-PI * 0.2) = %f\n", sin(-M_PI * 0.2));
    printf("sin(PI * 0)    = %f\n", sin(M_PI * 0));
    printf("sin(PI * 0.2)  = %f\n", sin(-M_PI * 0.2));
    printf("sin(PI * 0.5)  = %f\n", sin(M_PI * 0.5));
    printf("sin(PI * 1)    = %f\n", sin(M_PI * 1));
    printf("sin(PI * 1.5)  = %f\n", sin(M_PI * 1.5));
    printf("sin(PI * 2)    = %f\n", sin(M_PI * 2));
    printf("sin(PI * 2.5)  = %f\n", sin(M_PI * 2.5));
    printf("sin(PI * 3)    = %f\n", sin(M_PI * 3));
    printf("\n");

    printf("sqrt(NAN)  = %f\n", sqrt(NAN));
    printf("sqrt(0.16) = %f\n", sqrt(0.16));
    printf("sqrt(10.0) = %f\n", sqrt(10));
    printf("sqrt(16.0) = %f\n", sqrt(16.5));
    printf("\n");

    printf("tan(-PI / 3)   = %f\n", tan(-M_PI / 3));
    printf("tan(-PI / 2.5) = %f\n", tan(-M_PI / 2.5));
    printf("tan(-PI / 2)   = %f\n", tan(-M_PI / 2));
    printf("tan(-PI / 1.5) = %f\n", tan(-M_PI / 1.5));
    printf("tan(-PI / 1)   = %f\n", tan(-M_PI / 1));
    printf("tan(-PI / 0.5) = %f\n", tan(-M_PI / 0.5));
    printf("tan(-PI / 0.2) = %f\n", tan(-M_PI / 0.2));
    printf("tan(PI / 0)    = %f\n", tan(M_PI / 0));
    printf("tan(PI / 0.2)  = %f\n", tan(-M_PI / 0.2));
    printf("tan(PI / 0.5)  = %f\n", tan(M_PI / 0.5));
    printf("tan(PI / 1)    = %f\n", tan(M_PI / 1));
    printf("tan(PI / 1.5)  = %f\n", tan(M_PI / 1.5));
    printf("tan(PI / 2)    = %f\n", tan(M_PI / 2));
    printf("tan(PI / 2.5)  = %f\n", tan(M_PI / 2.5));
    printf("tan(PI / 3)    = %f\n", tan(M_PI / 3));
    printf("\n");

    return 0;
}
