#include "sfhs_mobile_hud.h"

#include <string.h>

#include "doomdef.h"
#include "doomstat.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define SFHS_KEEP EMSCRIPTEN_KEEPALIVE
#else
#define SFHS_KEEP
#endif

#define SFHS_MOBILE_HUD_SOURCE_Y \
    (SFHS_MOBILE_HUD_SOURCE_HEIGHT - SFHS_MOBILE_HUD_HEIGHT)

static uint8_t indexed[SFHS_MOBILE_HUD_WIDTH * SFHS_MOBILE_HUD_SOURCE_HEIGHT];
static uint8_t rgba[SFHS_MOBILE_HUD_WIDTH * SFHS_MOBILE_HUD_HEIGHT * 4];
static uint8_t palette[256][4];
static sfhs_mobile_hud_snapshot_t snapshot = {
    1, 1, 0, SFHS_MOBILE_HUD_WIDTH, SFHS_MOBILE_HUD_HEIGHT,
    SFHS_MOBILE_HUD_WIDTH * 4
};

static int LiveConsolePlayer(void)
{
    return gamestate == GS_LEVEL
        && consoleplayer >= 0
        && consoleplayer < MAXPLAYERS
        && playeringame[consoleplayer]
        && players[consoleplayer].mo != NULL;
}

uint8_t *sfhs_mobile_hud_indexed_buffer(void)
{
    return indexed;
}

void sfhs_mobile_hud_set_palette_entry(int index, int red, int green, int blue)
{
    if (index < 0 || index >= 256)
    {
        return;
    }

    palette[index][0] = (uint8_t) red;
    palette[index][1] = (uint8_t) green;
    palette[index][2] = (uint8_t) blue;
    palette[index][3] = 255;
}

void sfhs_mobile_hud_palette_updated(void)
{
    ++snapshot.palette_updates;
}

void sfhs_mobile_hud_publish(int effective_view_width,
                             int effective_view_height,
                             int effective_screenblocks,
                             int internal_status_active)
{
    const uint8_t *source = indexed
        + SFHS_MOBILE_HUD_SOURCE_Y * SFHS_MOBILE_HUD_WIDTH;
    uint32_t checksum = 2166136261u;
    int nonblank = 0;
    int pixel;

    snapshot.effective_view_width = effective_view_width;
    snapshot.effective_view_height = effective_view_height;
    snapshot.effective_screenblocks = effective_screenblocks;
    snapshot.internal_status_active = internal_status_active ? 1 : 0;

    if (!LiveConsolePlayer() || snapshot.palette_updates == 0)
    {
        if (snapshot.active)
        {
            snapshot.active = 0;
            memset(rgba, 0, sizeof(rgba));
            snapshot.checksum = 0;
            snapshot.nonblank_count = 0;
            ++snapshot.update_count;
        }
        return;
    }

    for (pixel = 0; pixel < SFHS_MOBILE_HUD_WIDTH * SFHS_MOBILE_HUD_HEIGHT;
         ++pixel)
    {
        const uint8_t *color = palette[source[pixel]];
        uint8_t *target = rgba + pixel * 4;
        int channel;

        target[0] = color[0];
        target[1] = color[1];
        target[2] = color[2];
        target[3] = color[3];
        if (color[0] != 0 || color[1] != 0 || color[2] != 0)
        {
            ++nonblank;
        }
        for (channel = 0; channel < 4; ++channel)
        {
            checksum ^= target[channel];
            checksum *= 16777619u;
        }
    }

    snapshot.active = 1;
    snapshot.checksum = (int32_t) checksum;
    snapshot.nonblank_count = nonblank;
    ++snapshot.update_count;
}

SFHS_KEEP const sfhs_mobile_hud_snapshot_t *sfhs_mobile_hud_snapshot(void)
{
    if (snapshot.active && !LiveConsolePlayer())
    {
        snapshot.active = 0;
        memset(rgba, 0, sizeof(rgba));
        snapshot.checksum = 0;
        snapshot.nonblank_count = 0;
        ++snapshot.update_count;
    }
    return &snapshot;
}

SFHS_KEEP const uint8_t *sfhs_mobile_hud_pixels(void)
{
    return rgba;
}
