#include "sfhs_mobile_state.h"
#include "doomdef.h"
#include "doomstat.h"
#include "i_video.h"
#include "p_local.h"
#include "r_state.h"
#include "d_items.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define SFHS_KEEP EMSCRIPTEN_KEEPALIVE
#else
#define SFHS_KEEP
#endif

#define SFHS_MOBILE_MAX_LINES 4096
static sfhs_mobile_state_t state;
static sfhs_mobile_line_t known[SFHS_MOBILE_MAX_LINES];
static sfhs_mobile_video_probe_t video_probe;

SFHS_KEEP const sfhs_mobile_state_t *sfhs_mobile_state_snapshot(void)
{
    player_t *player = &players[consoleplayer]; int i;
    state.version=1; state.active=playeringame[consoleplayer] && player->mo != NULL;
    state.episode=gameepisode; state.map=gamemap; state.health=player->health; state.armor=player->armorpoints;
    state.armor_type=player->armortype; state.weapon=player->readyweapon;
    state.ammo=weaponinfo[player->readyweapon].ammo == am_noammo ? 0 : player->ammo[weaponinfo[player->readyweapon].ammo]; state.keys=0;
    for(i=0;i<NUMCARDS;i++) if(player->cards[i]) state.keys|=1<<i;
    state.x=state.active?player->mo->x:0; state.y=state.active?player->mo->y:0; state.angle=state.active?player->mo->angle:0; state.line_count=0;
    for(i=0;i<numlines && state.line_count<SFHS_MOBILE_MAX_LINES;i++) if((lines[i].flags&ML_MAPPED) && !(lines[i].flags&ML_DONTDRAW)) {
        sfhs_mobile_line_t *out=&known[state.line_count++]; out->x1=lines[i].v1->x; out->y1=lines[i].v1->y; out->x2=lines[i].v2->x; out->y2=lines[i].v2->y; out->type=lines[i].special;
    }
    return &state;
}
SFHS_KEEP const sfhs_mobile_line_t *sfhs_mobile_state_lines(void) { return known; }

SFHS_KEEP const sfhs_mobile_video_probe_t *sfhs_mobile_video_probe(void)
{
    const int sample_count = 1024;
    const int pixels = SCREENWIDTH * SCREENHEIGHT;
    uint32_t checksum = 2166136261u;
    int nonblack = 0;
    int i;

    video_probe.version = 1;
    video_probe.width = SCREENWIDTH;
    video_probe.height = SCREENHEIGHT;
    video_probe.sample_count = 0;
    video_probe.nonblack_count = 0;
    video_probe.checksum = 0;

    if (I_VideoBuffer == NULL) return &video_probe;

    for (i = 0; i < sample_count; ++i)
    {
        const uint8_t pixel = I_VideoBuffer[(i * pixels) / sample_count];
        if (pixel != 0) ++nonblack;
        checksum ^= pixel;
        checksum *= 16777619u;
    }

    video_probe.sample_count = sample_count;
    video_probe.nonblack_count = nonblack;
    video_probe.checksum = (int32_t) checksum;
    ++video_probe.update_count;
    return &video_probe;
}
