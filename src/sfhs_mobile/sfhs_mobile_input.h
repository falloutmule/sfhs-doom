#ifndef SFHS_MOBILE_INPUT_H
#define SFHS_MOBILE_INPUT_H

enum
{
    SFHS_MOBILE_FORWARD, SFHS_MOBILE_BACKWARD, SFHS_MOBILE_STRAFE_LEFT,
    SFHS_MOBILE_STRAFE_RIGHT, SFHS_MOBILE_FIRE, SFHS_MOBILE_USE,
    SFHS_MOBILE_RUN, SFHS_MOBILE_MENU, SFHS_MOBILE_MAP,
    SFHS_MOBILE_WEAPON_PREVIOUS, SFHS_MOBILE_WEAPON_NEXT
};

typedef struct
{
    int version, total_calls, set_held_calls, pulse_calls, look_calls;
    int release_all_calls, posted_keydown, posted_keyup, posted_mouse;
    int invalid_actions, held_mask, last_action, last_down, last_key;
    int last_relative_x, pending_look_x, look_units_accumulated;
    int look_flush_calls, look_units_flushed, last_flushed_x;
} sfhs_mobile_input_debug_t;

int sfhs_mobile_input_version(void);
int sfhs_mobile_input_set_held(int action, int down);
int sfhs_mobile_input_pulse(int action);
int sfhs_mobile_input_post_look(int relative_x);
int sfhs_mobile_input_flush_look(void);
int sfhs_mobile_input_release_all(void);
const sfhs_mobile_input_debug_t *sfhs_mobile_input_debug_snapshot(void);

#endif
