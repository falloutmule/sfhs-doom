#ifndef SFHS_MOBILE_PRESENT_H
#define SFHS_MOBILE_PRESENT_H

#include <stdint.h>

typedef struct
{
    int32_t version, renderer_mode, finish_updates, presents, logical_nonblack;
    int32_t logical_checksum, argb_nonblack, argb_checksum, renderer_flags;
    int32_t output_width, output_height, force_software, smooth_scaling;
    int32_t lock_failures, blit_failures, target_failures, copy_failures;
    int32_t last_sdl_error_hash;
} sfhs_mobile_present_debug_t;

enum { SFHS_PRESENT_LOCK = 1, SFHS_PRESENT_BLIT, SFHS_PRESENT_TARGET,
       SFHS_PRESENT_COPY, SFHS_PRESENT_CLEAR };

int sfhs_mobile_present_configure_renderer(int compatibility);
void sfhs_mobile_present_apply_configuration(void);
void sfhs_mobile_present_note_logical(const uint8_t *pixels, int count);
void sfhs_mobile_present_note_argb(const void *pixels, int bytes);
void sfhs_mobile_present_note_renderer(int flags, int output_width, int output_height);
void sfhs_mobile_present_note_sdl_result(int operation, int result, const char *error);
void sfhs_mobile_present_note_present(void);
const sfhs_mobile_present_debug_t *sfhs_mobile_present_debug_snapshot(void);

#endif
