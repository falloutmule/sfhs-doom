#ifndef SFHS_MOBILE_INPUT_H
#define SFHS_MOBILE_INPUT_H

enum
{
    SFHS_MOBILE_FORWARD, SFHS_MOBILE_BACKWARD, SFHS_MOBILE_STRAFE_LEFT,
    SFHS_MOBILE_STRAFE_RIGHT, SFHS_MOBILE_FIRE, SFHS_MOBILE_USE,
    SFHS_MOBILE_RUN, SFHS_MOBILE_MENU, SFHS_MOBILE_MAP,
    SFHS_MOBILE_WEAPON_PREVIOUS, SFHS_MOBILE_WEAPON_NEXT
};

int sfhs_mobile_input_version(void);
void sfhs_mobile_input_set_held(int action, int down);
void sfhs_mobile_input_pulse(int action);
void sfhs_mobile_input_post_look(int relative_x);
void sfhs_mobile_input_release_all(void);

#endif
