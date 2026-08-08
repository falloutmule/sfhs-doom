#ifndef SFHS_MOBILE_HUD_H
#define SFHS_MOBILE_HUD_H

#include <stdint.h>

#define SFHS_MOBILE_HUD_WIDTH 320
#define SFHS_MOBILE_HUD_HEIGHT 32
#define SFHS_MOBILE_HUD_SOURCE_HEIGHT 200

typedef struct
{
    int32_t version;
    int32_t enabled;
    int32_t active;
    int32_t width;
    int32_t height;
    int32_t rgba_pitch;
    int32_t update_count;
    int32_t checksum;
    int32_t nonblank_count;
    int32_t effective_view_width;
    int32_t effective_view_height;
    int32_t effective_screenblocks;
    int32_t internal_status_active;
    int32_t palette_updates;
} sfhs_mobile_hud_snapshot_t;

uint8_t *sfhs_mobile_hud_indexed_buffer(void);
void sfhs_mobile_hud_set_palette_entry(int index, int red, int green, int blue);
void sfhs_mobile_hud_palette_updated(void);
void sfhs_mobile_hud_publish(int effective_view_width,
                             int effective_view_height,
                             int effective_screenblocks,
                             int internal_status_active);
const sfhs_mobile_hud_snapshot_t *sfhs_mobile_hud_snapshot(void);
const uint8_t *sfhs_mobile_hud_pixels(void);

#endif
