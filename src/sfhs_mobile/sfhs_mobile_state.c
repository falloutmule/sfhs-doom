#include "sfhs_mobile_state.h"
#include "doomstat.h"
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
