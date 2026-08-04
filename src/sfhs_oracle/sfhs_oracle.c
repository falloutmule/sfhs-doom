#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "d_player.h"
#include "doomstat.h"
#include "i_video.h"
#include "sfhs_oracle.h"

#define ORACLE_FRAME_BYTES (SCREENWIDTH * SCREENHEIGHT)

static const int checkpoints[] = {1, 35, 70, 140};
static boolean initial_written;
static boolean state_written[4];
static boolean frame_written[4];
static FILE *state_file;

static const char *OracleOutput(void)
{
    static const char *output;
    static boolean checked;

    if (!checked)
    {
        output = getenv("SFHS_ORACLE_OUTPUT");
        checked = true;
    }

    return output != NULL && output[0] != '\0' ? output : NULL;
}

static int CheckpointIndex(int tic)
{
    unsigned int i;

    for (i = 0; i < sizeof(checkpoints) / sizeof(checkpoints[0]); ++i)
    {
        if (checkpoints[i] == tic)
        {
            return (int) i;
        }
    }

    return -1;
}

static FILE *StateFile(void)
{
    char path[4096];
    const char *output = OracleOutput();

    if (output == NULL)
    {
        return NULL;
    }

    if (state_file == NULL)
    {
        if (snprintf(path, sizeof(path), "%s/state.jsonl", output)
            >= (int) sizeof(path))
        {
            return NULL;
        }
        state_file = fopen(path, "w");
    }

    return state_file;
}

void SFHS_OracleCaptureState(int tic, boolean initial)
{
    FILE *stream;
    player_t *player;
    int index = CheckpointIndex(tic);

    if (gamestate != GS_LEVEL || !playeringame[consoleplayer])
    {
        return;
    }

    if (initial)
    {
        if (initial_written)
        {
            return;
        }
        initial_written = true;
    }
    else
    {
        if (index < 0 || state_written[index])
        {
            return;
        }
        state_written[index] = true;
    }

    stream = StateFile();
    player = &players[consoleplayer];
    if (stream == NULL || player->mo == NULL)
    {
        return;
    }

    fprintf(stream,
            "{\"checkpoint\":\"%s\",\"tic\":%d,\"final\":%s,"
            "\"gamestate\":%d,\"episode\":%d,\"map\":%d,\"skill\":%d,"
            "\"x\":%" PRId32 ",\"y\":%" PRId32 ",\"z\":%" PRId32 ","
            "\"angle\":%" PRIu32 ",\"health\":%d,\"armor\":%d,"
            "\"readyweapon\":%d,\"kills\":%d,\"items\":%d,"
            "\"secrets\":%d,\"leveltime\":%d,\"rndindex\":%d,"
            "\"ammo0\":%d,\"maxammo0\":%d}\n",
            initial ? "initial" : (tic == 140 ? "tic-140-final" : "tic"),
            tic,
            tic == 140 ? "true" : "false",
            gamestate,
            gameepisode,
            gamemap,
            gameskill,
            (int32_t) player->mo->x,
            (int32_t) player->mo->y,
            (int32_t) player->mo->z,
            (uint32_t) player->mo->angle,
            player->health,
            player->armorpoints,
            player->readyweapon,
            player->killcount,
            player->itemcount,
            player->secretcount,
            leveltime,
            rndindex,
            player->ammo[0],
            player->maxammo[0]);
    fflush(stream);
}

void SFHS_OracleCaptureFrame(int tic, const pixel_t *framebuffer)
{
    char path[4096];
    const char *output = OracleOutput();
    FILE *stream;
    int index = CheckpointIndex(tic);

    if (output == NULL || framebuffer == NULL || index < 0
        || frame_written[index] || gamestate != GS_LEVEL)
    {
        return;
    }

    frame_written[index] = true;
    if (snprintf(path, sizeof(path), "%s/frame-%03d.bin", output, tic)
        >= (int) sizeof(path))
    {
        return;
    }

    stream = fopen(path, "wb");
    if (stream == NULL)
    {
        return;
    }

    fwrite(framebuffer, 1, ORACLE_FRAME_BYTES, stream);
    fclose(stream);
}
