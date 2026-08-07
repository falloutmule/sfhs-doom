#include "sfhs_mobile_present.h"

#include <stdint.h>

#include "i_video.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define SFHS_KEEP EMSCRIPTEN_KEEPALIVE
#else
#define SFHS_KEEP
#endif

static int compatibility_requested;
static sfhs_mobile_present_debug_t debug = { 1 };

static int32_t SampleBytes(const uint8_t *pixels, int bytes, int *nonblack)
{
    uint32_t checksum = 2166136261u;
    int index, samples = bytes < 4096 ? bytes : 4096;
    *nonblack = 0;
    if (pixels == NULL || bytes <= 0) return 0;
    for (index = 0; index < samples; ++index)
    {
        const uint8_t value = pixels[(index * bytes) / samples];
        if (value != 0) ++*nonblack;
        checksum ^= value;
        checksum *= 16777619u;
    }
    return (int32_t) checksum;
}

static int ErrorHash(const char *text)
{
    uint32_t value = 2166136261u;
    if (text == NULL) return 0;
    while (*text != '\0') { value ^= (uint8_t) *text++; value *= 16777619u; }
    return (int32_t) value;
}

SFHS_KEEP int sfhs_mobile_present_configure_renderer(int compatibility)
{
    compatibility_requested = compatibility ? 1 : 0;
    debug.renderer_mode = compatibility_requested;
    return compatibility_requested;
}

void sfhs_mobile_present_apply_configuration(void)
{
    if (compatibility_requested)
    {
        force_software_renderer = 1;
        smooth_pixel_scaling = 0;
    }
    debug.force_software = force_software_renderer;
    debug.smooth_scaling = smooth_pixel_scaling;
}

void sfhs_mobile_present_note_logical(const uint8_t *pixels, int count)
{
    debug.logical_checksum = SampleBytes(pixels, count, (int *) &debug.logical_nonblack);
    ++debug.finish_updates;
}

void sfhs_mobile_present_note_argb(const void *pixels, int bytes)
{
    debug.argb_checksum = SampleBytes((const uint8_t *) pixels, bytes,
                                      (int *) &debug.argb_nonblack);
}

void sfhs_mobile_present_note_renderer(int flags, int output_width, int output_height)
{
    debug.renderer_flags = flags;
    debug.output_width = output_width;
    debug.output_height = output_height;
    debug.force_software = force_software_renderer;
    debug.smooth_scaling = smooth_pixel_scaling;
}

void sfhs_mobile_present_note_sdl_result(int operation, int result, const char *error)
{
    if (result >= 0) return;
    if (operation == SFHS_PRESENT_LOCK) ++debug.lock_failures;
    else if (operation == SFHS_PRESENT_BLIT) ++debug.blit_failures;
    else if (operation == SFHS_PRESENT_TARGET) ++debug.target_failures;
    else if (operation == SFHS_PRESENT_COPY) ++debug.copy_failures;
    debug.last_sdl_error_hash = ErrorHash(error);
}

void sfhs_mobile_present_note_present(void) { ++debug.presents; }

SFHS_KEEP const sfhs_mobile_present_debug_t *sfhs_mobile_present_debug_snapshot(void)
{
    return &debug;
}
