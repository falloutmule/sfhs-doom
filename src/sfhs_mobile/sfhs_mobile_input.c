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
static sfhs_mobile_input_debug_t debug;

static void InitDebug(void)
{
    if (debug.version == 0)
    {
        debug.version = 1;
        debug.last_action = -1;
    }
}

static void UpdateHeldMask(void)
{
    int action;
    debug.held_mask = 0;
    for (action = 0; action < 11; ++action)
    {
        if (held[action]) debug.held_mask |= 1 << action;
    }
}

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

static int PostKey(int type, int key)
{
    event_t event = { 0 };
    if (key == 0) return -2;
    event.type = type; event.data1 = key; event.data2 = 0; event.data3 = 0;
    D_PostEvent(&event);
    if (type == ev_keydown) ++debug.posted_keydown;
    else if (type == ev_keyup) ++debug.posted_keyup;
    return 1;
}

SFHS_KEEP int sfhs_mobile_input_version(void) { InitDebug(); return 2; }

SFHS_KEEP int sfhs_mobile_input_set_held(int action, int down)
{
    int key;
    InitDebug(); ++debug.total_calls; ++debug.set_held_calls;
    debug.last_action = action; debug.last_down = !!down;
    if (action < 0 || action >= 11)
    {
        ++debug.invalid_actions;
        return -1;
    }
    key = ActionKey(action);
    debug.last_key = key;
    if (key == 0) return -2;
    if (!!down == !!held[action]) return 0;
    held[action] = !!down;
    UpdateHeldMask();
    return PostKey(down ? ev_keydown : ev_keyup, key);
}

SFHS_KEEP int sfhs_mobile_input_pulse(int action)
{
    int key, down, up;
    InitDebug(); ++debug.total_calls; ++debug.pulse_calls;
    debug.last_action = action; debug.last_down = 1;
    if (action < 0 || action >= 11)
    {
        ++debug.invalid_actions;
        return -1;
    }
    key = ActionKey(action); debug.last_key = key;
    if (key == 0) return -2;
    down = PostKey(ev_keydown, key); up = PostKey(ev_keyup, key);
    return down > 0 && up > 0 ? 1 : (down < 0 ? down : up);
}

SFHS_KEEP int sfhs_mobile_input_post_look(int relative_x)
{
    event_t event = { 0 };
    InitDebug(); ++debug.total_calls; ++debug.look_calls;
    debug.last_relative_x = relative_x;
    if (relative_x == 0) return 0;
    event.type = ev_mouse; event.data1 = 0; event.data2 = relative_x; event.data3 = 0;
    D_PostEvent(&event);
    ++debug.posted_mouse;
    return 1;
}

SFHS_KEEP int sfhs_mobile_input_release_all(void)
{
    int action, result, changed = 0;
    InitDebug(); ++debug.total_calls; ++debug.release_all_calls;
    for (action = 0; action < 11; ++action)
    {
        result = sfhs_mobile_input_set_held(action, 0);
        if (result > 0) changed = 1;
    }
    return changed;
}

SFHS_KEEP const sfhs_mobile_input_debug_t *sfhs_mobile_input_debug_snapshot(void)
{
    InitDebug();
    return &debug;
}
