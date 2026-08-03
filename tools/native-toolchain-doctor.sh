#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
source "$script_dir/native-env.sh"

failures=0

check_command() {
    command_name="$1"
    if [[ -v SFHS_DOCTOR_FORCE_MISSING ]] && [[ "$SFHS_DOCTOR_FORCE_MISSING" == "$command_name" ]]; then
        echo "COMMAND $command_name FAIL forced-missing"
        failures=$((failures + 1))
        return
    fi
    if command_path="$(command -v "$command_name" 2>/dev/null)"; then
        echo "COMMAND $command_name PASS $command_path"
    else
        echo "COMMAND $command_name FAIL missing"
        failures=$((failures + 1))
    fi
}

check_pkg_version() {
    module="$1"
    minimum="$2"
    version="$(pkg-config --modversion "$module" 2>/dev/null || true)"
    if [[ -z "$version" ]]; then
        echo "PKG_CONFIG $module FAIL missing minimum=$minimum"
        failures=$((failures + 1))
    elif dpkg --compare-versions "$version" ge "$minimum"; then
        echo "PKG_CONFIG $module PASS version=$version minimum=$minimum"
    else
        echo "PKG_CONFIG $module FAIL version=$version minimum=$minimum"
        failures=$((failures + 1))
    fi
}

sfhs_native_identity
echo "UNAME=$(uname -a)"
echo "ARCH=$(dpkg --print-architecture)"
if [[ -v WSL_DISTRO_NAME ]]; then echo "DISTRO=$WSL_DISTRO_NAME"; else echo "DISTRO=unknown"; fi

for command_name in bash gcc ld cmake ninja pkg-config python3 Xvfb xauth convert xdotool curl unzip; do
    check_command "$command_name"
done

echo "GCC_VERSION=$(gcc --version | head -n 1)"
echo "LD_VERSION=$(ld --version | head -n 1)"
echo "CMAKE_VERSION=$(cmake --version | head -n 1)"
echo "NINJA_VERSION=$(ninja --version)"
echo "PKG_CONFIG_VERSION=$(pkg-config --version)"
echo "PYTHON_VERSION=$(python3 --version)"
echo "IMAGEMAGICK_VERSION=$(convert --version | head -n 1)"
echo "XDOTOOL_VERSION=$(xdotool version)"

check_pkg_version sdl2 2.0.14
check_pkg_version SDL2_mixer 2.0.2

for package_name in build-essential cmake ninja-build pkg-config libsdl2-dev libsdl2-mixer-dev python3 xvfb xauth imagemagick xdotool curl unzip ca-certificates; do
    package_version="$(dpkg-query -W "$package_name" 2>/dev/null | awk '{print $2}' || true)"
    if [[ -n "$package_version" ]]; then
        echo "PACKAGE $package_name PASS version=$package_version"
    else
        echo "PACKAGE $package_name FAIL missing"
        failures=$((failures + 1))
    fi
done

for optional_module in SDL2_net fluidsynth samplerate libpng; do
    optional_version="$(pkg-config --modversion "$optional_module" 2>/dev/null || true)"
    if [[ -n "$optional_version" ]]; then
        echo "OPTIONAL $optional_module PRESENT_DISABLED version=$optional_version"
    else
        echo "OPTIONAL $optional_module ABSENT"
    fi
done

if [[ -v DISPLAY ]]; then echo "DISPLAY=$DISPLAY"; else echo "DISPLAY=unset"; fi
if [[ -v WAYLAND_DISPLAY ]]; then echo "WAYLAND_DISPLAY=$WAYLAND_DISPLAY"; else echo "WAYLAND_DISPLAY=unset"; fi

if (( failures > 0 )); then
    echo "NATIVE_TOOLCHAIN_DOCTOR=FAIL failures=$failures" >&2
    exit 1
fi

echo "NATIVE_TOOLCHAIN_DOCTOR=PASS"
