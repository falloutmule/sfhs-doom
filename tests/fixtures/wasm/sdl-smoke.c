#include <SDL.h>
#include <emscripten.h>

int main(void) {
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        return 11;
    }

    SDL_Window *window = SDL_CreateWindow(
        "SFHS SDL smoke",
        SDL_WINDOWPOS_UNDEFINED,
        SDL_WINDOWPOS_UNDEFINED,
        64,
        64,
        SDL_WINDOW_SHOWN
    );
    if (window == NULL) {
        SDL_Quit();
        return 12;
    }

    SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    if (renderer == NULL) {
        SDL_DestroyWindow(window);
        SDL_Quit();
        return 13;
    }

    SDL_SetRenderDrawColor(renderer, 17, 34, 51, 255);
    SDL_RenderClear(renderer);
    SDL_RenderPresent(renderer);

    EM_ASM({
        document.body.setAttribute('data-sfhs-wasm-smoke', 'pass');
        document.body.textContent = 'SFHS WASM SDL smoke PASS';
    });

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
    return 0;
}
