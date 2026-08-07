#ifndef SFHS_MOBILE_STATE_H
#define SFHS_MOBILE_STATE_H

#include <stdint.h>

typedef struct { int32_t x1, y1, x2, y2, type; } sfhs_mobile_line_t;
typedef struct { int32_t version, active, episode, map, x, y, angle, health, armor, armor_type, weapon, ammo, keys, line_count; } sfhs_mobile_state_t;
typedef struct { int32_t version, width, height, sample_count, nonblack_count, checksum, update_count; } sfhs_mobile_video_probe_t;

const sfhs_mobile_state_t *sfhs_mobile_state_snapshot(void);
const sfhs_mobile_line_t *sfhs_mobile_state_lines(void);
const sfhs_mobile_video_probe_t *sfhs_mobile_video_probe(void);

#endif
