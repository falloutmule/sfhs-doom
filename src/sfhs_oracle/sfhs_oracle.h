#ifndef SFHS_ORACLE_H
#define SFHS_ORACLE_H

#include "doomtype.h"

void SFHS_OracleCaptureState(int tic, boolean initial);
void SFHS_OracleCaptureFrame(int tic, const pixel_t *framebuffer);

#endif
