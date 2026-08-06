#include "sfhs_mobile_input.h"

#include "d_event.h"
#include "m_controls.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define SFHS_KEEP EMSCRIPTEN_KEEPALIVE
#else
#define SFHS_KEEP
#endif

static int held[11];

static int ActionKey(int action)
{
    switch (action)
    {
        case SFHS_MOBILE_FORWARD: return key_up;
        case SFHS_MOBILE_BACKWARD: return key_down;
        case SFHS_MOBILE_STRAFE_LEFT: return key_strafeleft;
        case SFHS_MOBILE_STRAFE_RIGHT: return key_straferight;
        case SFHS_MOBILE_FIRE: return key_fire;
        case SFHS_MOBILE_USE: return key_use;
        case SFHS_MOBILE_RUN: return key_speed;
        case SFHS_MOBILE_MENU: return key_menu_activate;
        case SFHS_MOBILE_MAP: return key_map_toggle;
        case SFHS_MOBILE_WEAPON_PREVIOUS: return key_prevweapon;
        case SFHS_MOBILE_WEAPON_NEXT: return key_nextweapon;
        default: return 0;
    }
}

static void PostKey(int type, int key)
{
    event_t event;
    if (key == 0) return;
    event.type = type; event.data1 = key; event.data2 = 0; event.data3 = 0;
    D_PostEvent(&event);
}

SFHS_KEEP int sfhs_mobile_input_version(void) { return 1; }

SFHS_KEEP void sfhs_mobile_input_set_held(int action, int down)
{
    if (action < 0 || action >= 11 || !!down == !!held[action]) return;
    held[action] = !!down;
    PostKey(down ? ev_keydown : ev_keyup, ActionKey(action));
}

SFHS_KEEP void sfhs_mobile_input_pulse(int action)
{
    int key = ActionKey(action);
    PostKey(ev_keydown, key); PostKey(ev_keyup, key);
}

SFHS_KEEP void sfhs_mobile_input_post_look(int relative_x)
{
    event_t event;
    if (relative_x == 0) return;
    event.type = ev_mouse; event.data1 = 0; event.data2 = relative_x; event.data3 = 0;
    D_PostEvent(&event);
}

SFHS_KEEP void sfhs_mobile_input_release_all(void)
{
    int action;
    for (action = 0; action < 11; ++action) sfhs_mobile_input_set_held(action, 0);
}
