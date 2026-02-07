#!/usr/bin/env bash
set -euo pipefail
APP=embedder-cli

MUTED='\033[0;2m'
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[38;5;214m'
NC='\033[0m' # No Color

usage() {
    cat <<EOF
Embedder CLI Installer

Usage: install.sh [options]

Options:
    -h, --help              Display this help message
    -v, --version <version> Install a specific version (e.g., 3.0.0)
    -b, --binary <path>     Install from a local binary instead of downloading
        --no-modify-path    Don't modify shell config files (.zshrc, .bashrc, etc.)

Examples:
    curl -fsSL https://embedder.com/install | bash
    curl -fsSL https://embedder.com/install | bash -s -- --version 3.0.0
    ./install.sh --binary /path/to/embedder-cli
EOF
}

requested_version=${VERSION:-}
no_modify_path=false
binary_path=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--version)
            if [[ -n "${2:-}" ]]; then
                requested_version="$2"
                shift 2
            else
                echo -e "${RED}Error: --version requires a version argument${NC}"
                exit 1
            fi
            ;;
        -b|--binary)
            if [[ -n "${2:-}" ]]; then
                binary_path="$2"
                shift 2
            else
                echo -e "${RED}Error: --binary requires a path argument${NC}"
                exit 1
            fi
            ;;
        --no-modify-path)
            no_modify_path=true
            shift
            ;;
        *)
            echo -e "${ORANGE}Warning: Unknown option '$1'${NC}" >&2
            shift
            ;;
    esac
done

INSTALL_DIR=$HOME/.embedder/bin
mkdir -p "$INSTALL_DIR"

# If --binary is provided, skip all download/detection logic
if [ -n "$binary_path" ]; then
    if [ ! -f "$binary_path" ]; then
        echo -e "${RED}Error: Binary not found at ${binary_path}${NC}"
        exit 1
    fi
    specific_version="0.3.16"
else
    raw_os=$(uname -s)
    os=$(echo "$raw_os" | tr '[:upper:]' '[:lower:]')
    case "$raw_os" in
      Darwin*) os="darwin" ;;
      Linux*) os="linux" ;;
      MINGW*|MSYS*|CYGWIN*) os="windows" ;;
    esac

    arch=$(uname -m)
    if [[ "$arch" == "aarch64" ]]; then
      arch="arm64"
    fi
    if [[ "$arch" == "x86_64" ]]; then
      arch="x64"
    fi

    if [ "$os" = "darwin" ] && [ "$arch" = "x64" ]; then
      rosetta_flag=$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)
      if [ "$rosetta_flag" = "1" ]; then
        arch="arm64"
      fi
    fi

    combo="$os-$arch"
    case "$combo" in
      linux-x64|darwin-x64|darwin-arm64|windows-x64)
        ;;
      linux-arm64)
        echo -e "${RED}Linux ARM64 is not yet supported.${NC}"
        echo -e "${MUTED}Supported platforms: Linux x64, macOS (Intel/Apple Silicon), Windows x64${NC}"
        exit 1
        ;;
      *)
        echo -e "${RED}Unsupported OS/Arch: $os/$arch${NC}"
        exit 1
        ;;
    esac

    is_musl=false
    if [ "$os" = "linux" ]; then
      if [ -f /etc/alpine-release ]; then
        is_musl=true
      fi

      if command -v ldd >/dev/null 2>&1; then
        if ldd --version 2>&1 | grep -qi musl; then
          is_musl=true
        fi
      fi
    fi

    needs_baseline=false
    if [ "$arch" = "x64" ]; then
      if [ "$os" = "linux" ]; then
        if ! grep -qi avx2 /proc/cpuinfo 2>/dev/null; then
          needs_baseline=true
        fi
      fi

      if [ "$os" = "darwin" ]; then
        avx2=$(sysctl -n hw.optional.avx2_0 2>/dev/null || echo 0)
        if [ "$avx2" != "1" ]; then
          needs_baseline=true
        fi
      fi
    fi

    target="$os-$arch"
    if [ "$needs_baseline" = "true" ]; then
      target="$target-baseline"
    fi
    if [ "$is_musl" = "true" ]; then
      target="$target-musl"
    fi

    # Map to embedder binary naming convention
    case "$target" in
      darwin-x64|darwin-x64-baseline) binary_name="embedder-cli-darwin" ;;
      darwin-arm64) binary_name="embedder-cli-darwin-arm64" ;;
      linux-x64|linux-x64-baseline|linux-x64-musl|linux-x64-baseline-musl) binary_name="embedder-cli-linux" ;;
      windows-x64) binary_name="embedder-cli.exe" ;;
      *)
        echo -e "${RED}Unsupported target: $target${NC}"
        exit 1
        ;;
    esac

    if [ -z "$requested_version" ]; then
        specific_version="0.3.16"
        url="https://github.com/embedder-dev/embedder-cli/releases/download/v${specific_version}/$binary_name"
    else
        # Strip leading 'v' if present
        requested_version="${requested_version#v}"
        url="https://github.com/embedder-dev/embedder-cli/releases/download/v${requested_version}/$binary_name"
        specific_version=$requested_version

        # Verify the release exists before downloading
        http_status=$(curl -sI -o /dev/null -w "%{http_code}" "https://github.com/embedder-dev/embedder-cli/releases/tag/v${requested_version}")
        if [ "$http_status" = "404" ]; then
            echo -e "${RED}Error: Release v${requested_version} not found${NC}"
            echo -e "${MUTED}Available releases: https://github.com/embedder-dev/embedder-cli/releases${NC}"
            exit 1
        fi
    fi
fi

print_message() {
    local level=$1
    local message=$2
    local color=""

    case $level in
        info) color="${NC}" ;;
        success) color="${GREEN}" ;;
        warning) color="${ORANGE}" ;;
        error) color="${RED}" ;;
    esac

    echo -e "${color}${message}${NC}"
}

check_version() {
    if command -v embedder >/dev/null 2>&1; then
        embedder_path=$(which embedder)

        ## Check the installed version
        installed_version=$(embedder --version 2>/dev/null || echo "")

        if [[ "$installed_version" == "$specific_version" ]]; then
            print_message info "${MUTED}Version ${NC}$specific_version${MUTED} already installed"
            exit 0
        elif [[ -n "$installed_version" ]]; then
            print_message info "${MUTED}Installed version: ${NC}$installed_version."
        fi
    fi
}

remove_npm_global() {
    # Check if embedder is installed via npm globally
    if command -v npm >/dev/null 2>&1; then
        local npm_list_output
        npm_list_output=$(npm list -g @embedder/embedder 2>/dev/null || echo "")
        
        if echo "$npm_list_output" | grep -q "@embedder/embedder@"; then
            print_message info "Found global npm installation of @embedder/embedder, removing..."
            
            # Try to remove without sudo first
            if npm uninstall -g @embedder/embedder 2>/dev/null; then
                print_message success "Successfully removed npm global @embedder/embedder"
            else
                # Retry with sudo
                print_message warning "Retrying with sudo (you may be prompted for your password)..."
                
                # Show cursor so user can enter password
                printf "\033[?25h"
                
                if sudo npm uninstall -g @embedder/embedder; then
                    # Hide cursor again
                    printf "\033[?25l"
                    print_message success "Successfully removed npm global @embedder/embedder with sudo"
                else
                    # Hide cursor again
                    printf "\033[?25l"
                    print_message warning "Could not remove npm global @embedder/embedder. You may need to remove it manually:"
                    print_message info "  sudo npm uninstall -g @embedder/embedder"
                fi
            fi
        fi
    fi
}

unbuffered_sed() {
    if echo | sed -u -e "" >/dev/null 2>&1; then
        sed -nu "$@"
    elif echo | sed -l -e "" >/dev/null 2>&1; then
        sed -nl "$@"
    else
        local pad="$(printf "\n%512s" "")"
        sed -ne "s/$/\\${pad}/" "$@"
    fi
}

print_progress() {
    local bytes="$1"
    local length="$2"
    [ "$length" -gt 0 ] || return 0

    local width=50
    local percent=$(( bytes * 100 / length ))
    [ "$percent" -gt 100 ] && percent=100
    local on=$(( percent * width / 100 ))
    local off=$(( width - on ))

    local filled=$(printf "%*s" "$on" "")
    filled=${filled// /鈻爙
    local empty=$(printf "%*s" "$off" "")
    empty=${empty// /锝

    printf "\r${ORANGE}%s%s %3d%%${NC}" "$filled" "$empty" "$percent" >&4
}

download_with_progress() {
    local url="$1"
    local output="$2"

    if [ -t 2 ]; then
        exec 4>&2
    else
        exec 4>/dev/null
    fi

    local tmp_dir=${TMPDIR:-/tmp}
    local basename="${tmp_dir}/embedder_install_$$"
    local tracefile="${basename}.trace"

    rm -f "$tracefile"
    mkfifo "$tracefile"

    # Hide cursor
    printf "\033[?25l" >&4

    trap "trap - RETURN; rm -f \"$tracefile\"; printf '\033[?25h' >&4; exec 4>&-" RETURN

    (
        curl --trace-ascii "$tracefile" -s -L -o "$output" "$url"
    ) &
    local curl_pid=$!

    unbuffered_sed \
        -e 'y/ACDEGHLNORTV/acdeghlnortv/' \
        -e '/^0000: content-length:/p' \
        -e '/^<= recv data/p' \
        "$tracefile" | \
    {
        local length=0
        local bytes=0

        while IFS=" " read -r -a line; do
            [ "${#line[@]}" -lt 2 ] && continue
            local tag="${line[0]} ${line[1]}"

            if [ "$tag" = "0000: content-length:" ]; then
                length="${line[2]}"
                length=$(echo "$length" | tr -d '\r')
                bytes=0
            elif [ "$tag" = "<= recv" ]; then
                local size="${line[3]}"
                bytes=$(( bytes + size ))
                if [ "$length" -gt 0 ]; then
                    print_progress "$bytes" "$length"
                fi
            fi
        done
    }

    wait $curl_pid
    local ret=$?
    echo "" >&4
    return $ret
}

download_and_install() {
    print_message info "\n${MUTED}Installing ${NC}embedder ${MUTED}version: ${NC}$specific_version"
    local tmp_dir="${TMPDIR:-/tmp}/embedder_install_$$"
    mkdir -p "$tmp_dir"

    if [[ "$os" == "windows" ]] || ! [ -t 2 ] || ! download_with_progress "$url" "$tmp_dir/$binary_name"; then
        # Fallback to standard curl on Windows, non-TTY environments, or if custom progress fails
        curl -# -L -o "$tmp_dir/$binary_name" "$url"
    fi

    mv "$tmp_dir/$binary_name" "${INSTALL_DIR}/embedder"
    chmod 755 "${INSTALL_DIR}/embedder"
    
    # Remove quarantine attribute and re-sign on macOS (prevents Gatekeeper from blocking)
    if [ "$os" = "darwin" ]; then
        xattr -d com.apple.quarantine "${INSTALL_DIR}/embedder" 2>/dev/null || true
        codesign --remove-signature "${INSTALL_DIR}/embedder" 2>/dev/null || true
        codesign -s - "${INSTALL_DIR}/embedder" 2>/dev/null || true
    fi
    
    rm -rf "$tmp_dir"
}

install_from_binary() {
    print_message info "\n${MUTED}Installing ${NC}embedder ${MUTED}from: ${NC}$binary_path"
    cp "$binary_path" "${INSTALL_DIR}/embedder"
    chmod 755 "${INSTALL_DIR}/embedder"
    
    # Remove quarantine attribute and re-sign on macOS (prevents Gatekeeper from blocking)
    if [ "$(uname -s)" = "Darwin" ]; then
        xattr -d com.apple.quarantine "${INSTALL_DIR}/embedder" 2>/dev/null || true
        codesign --remove-signature "${INSTALL_DIR}/embedder" 2>/dev/null || true
        codesign -s - "${INSTALL_DIR}/embedder" 2>/dev/null || true
    fi
}

install_ripgrep() {
    if command -v rg >/dev/null 2>&1; then
        print_message info "${MUTED}ripgrep already installed${NC}"
        return 0
    fi
    
    if [ -f "${INSTALL_DIR}/rg" ]; then
        print_message info "${MUTED}ripgrep already installed in ${INSTALL_DIR}${NC}"
        return 0
    fi
    
    print_message info "${MUTED}Installing ripgrep...${NC}"
    
    local rg_version="14.1.1"
    local rg_target=""
    
    case "$os-$arch" in
        darwin-arm64) rg_target="aarch64-apple-darwin" ;;
        darwin-x64) rg_target="x86_64-apple-darwin" ;;
        linux-x64) rg_target="x86_64-unknown-linux-musl" ;;
        *) 
            print_message warning "Ripgrep not available for $os-$arch, some features may not work"
            return 1 
            ;;
    esac
    
    local rg_url="https://github.com/BurntSushi/ripgrep/releases/download/${rg_version}/ripgrep-${rg_version}-${rg_target}.tar.gz"
    local tmp_dir="${TMPDIR:-/tmp}/ripgrep_install_$$"
    mkdir -p "$tmp_dir"
    
    if curl -sL "$rg_url" | tar -xz -C "$tmp_dir"; then
        mv "$tmp_dir/ripgrep-${rg_version}-${rg_target}/rg" "${INSTALL_DIR}/rg"
        chmod +x "${INSTALL_DIR}/rg"
        # Remove quarantine attribute and re-sign on macOS
        if [ "$os" = "darwin" ]; then
            xattr -d com.apple.quarantine "${INSTALL_DIR}/rg" 2>/dev/null || true
            codesign -s - "${INSTALL_DIR}/rg" 2>/dev/null || true
        fi
        print_message success "ripgrep installed successfully"
    else
        print_message warning "Failed to install ripgrep, some features may not work"
    fi
    
    rm -rf "$tmp_dir"
}

install_clangd() {
    if command -v clangd >/dev/null 2>&1; then
        print_message info "${MUTED}clangd already installed${NC}"
        return 0
    fi
    
    if [ -f "${INSTALL_DIR}/clangd" ]; then
        print_message info "${MUTED}clangd already installed in ${INSTALL_DIR}${NC}"
        return 0
    fi
    
    print_message info "${MUTED}Installing clangd...${NC}"
    
    local clangd_version="19.1.2"
    local clangd_target=""
    
    case "$os-$arch" in
        darwin-arm64) clangd_target="clangd-mac-${clangd_version}" ;;
        darwin-x64) clangd_target="clangd-mac-${clangd_version}" ;;
        linux-x64) clangd_target="clangd-linux-${clangd_version}" ;;
        *) 
            print_message warning "clangd not available for $os-$arch, C/C++ LSP features may not work"
            return 1 
            ;;
    esac
    
    local clangd_url="https://github.com/clangd/clangd/releases/download/${clangd_version}/${clangd_target}.zip"
    local tmp_dir="${TMPDIR:-/tmp}/clangd_install_$$"
    mkdir -p "$tmp_dir"
    
    if curl -sL "$clangd_url" -o "$tmp_dir/clangd.zip" && unzip -q "$tmp_dir/clangd.zip" -d "$tmp_dir"; then
        mv "$tmp_dir/clangd_${clangd_version}/bin/clangd" "${INSTALL_DIR}/clangd"
        chmod +x "${INSTALL_DIR}/clangd"
        # Remove quarantine attribute and re-sign on macOS
        if [ "$os" = "darwin" ]; then
            xattr -d com.apple.quarantine "${INSTALL_DIR}/clangd" 2>/dev/null || true
            codesign -s - "${INSTALL_DIR}/clangd" 2>/dev/null || true
        fi
        print_message success "clangd installed successfully"
    else
        print_message warning "Failed to install clangd, C/C++ LSP features may not work"
    fi
    
    rm -rf "$tmp_dir"
}

install_rust_analyzer() {
    if command -v rust-analyzer >/dev/null 2>&1; then
        print_message info "${MUTED}rust-analyzer already installed${NC}"
        return 0
    fi
    
    if [ -f "${INSTALL_DIR}/rust-analyzer" ]; then
        print_message info "${MUTED}rust-analyzer already installed in ${INSTALL_DIR}${NC}"
        return 0
    fi
    
    print_message info "${MUTED}Installing rust-analyzer...${NC}"
    
    local ra_version="2024-12-23"
    local ra_target=""
    
    case "$os-$arch" in
        darwin-arm64) ra_target="rust-analyzer-aarch64-apple-darwin" ;;
        darwin-x64) ra_target="rust-analyzer-x86_64-apple-darwin" ;;
        linux-x64) ra_target="rust-analyzer-x86_64-unknown-linux-gnu" ;;
        *) 
            print_message warning "rust-analyzer not available for $os-$arch, Rust LSP features may not work"
            return 1 
            ;;
    esac
    
    local ra_url="https://github.com/rust-lang/rust-analyzer/releases/download/${ra_version}/${ra_target}.gz"
    local tmp_dir="${TMPDIR:-/tmp}/rust_analyzer_install_$$"
    mkdir -p "$tmp_dir"
    
    if curl -sL "$ra_url" | gunzip > "$tmp_dir/rust-analyzer"; then
        mv "$tmp_dir/rust-analyzer" "${INSTALL_DIR}/rust-analyzer"
        chmod +x "${INSTALL_DIR}/rust-analyzer"
        # Remove quarantine attribute and re-sign on macOS
        if [ "$os" = "darwin" ]; then
            xattr -d com.apple.quarantine "${INSTALL_DIR}/rust-analyzer" 2>/dev/null || true
            codesign -s - "${INSTALL_DIR}/rust-analyzer" 2>/dev/null || true
        fi
        print_message success "rust-analyzer installed successfully"
    else
        print_message warning "Failed to install rust-analyzer, Rust LSP features may not work"
    fi
    
    rm -rf "$tmp_dir"
}

install_dependencies() {
    print_message info "${MUTED}Installing dependencies...${NC}"
    
    # Run all installations in parallel
    install_ripgrep &
    local pid_rg=$!
    
    install_clangd &
    local pid_clangd=$!
    
    install_rust_analyzer &
    local pid_ra=$!
    
    # Wait for all background jobs
    wait $pid_rg $pid_clangd $pid_ra
}

clear_cache() {
    # Clear cached Rust embedding library
    local cache_dir=""
    
    if [ "$(uname -s)" = "Darwin" ]; then
        cache_dir="$HOME/Library/Caches/embedder-cli"
    else
        # Linux: respect XDG_CACHE_HOME or default to ~/.cache
        cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/embedder-cli"
    fi
    
    if [ -d "$cache_dir" ]; then
        print_message info "${MUTED}Clearing cache at ${NC}$cache_dir"
        rm -rf "$cache_dir"
        print_message success "Cache cleared"
    fi
}

if [ -n "$binary_path" ]; then
    clear_cache
    install_from_binary
else
    check_version
    remove_npm_global
    clear_cache
    download_and_install
fi

# Install dependencies for tools (ripgrep, clangd, rust-analyzer)
install_dependencies

add_to_path() {
    local config_file=$1
    local command=$2

    if grep -Fxq "$command" "$config_file"; then
        print_message info "Command already exists in $config_file, skipping write."
    elif [[ -w $config_file ]]; then
        echo -e "\n# embedder" >> "$config_file"
        echo "$command" >> "$config_file"
        print_message info "${MUTED}Successfully added ${NC}embedder ${MUTED}to \$PATH in ${NC}$config_file"
    else
        print_message warning "Manually add the directory to $config_file (or similar):"
        print_message info "  $command"
    fi
}

XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-$HOME/.config}

current_shell=$(basename "$SHELL")
case $current_shell in
    fish)
        config_files="$HOME/.config/fish/config.fish"
    ;;
    zsh)
        config_files="${ZDOTDIR:-$HOME}/.zshrc ${ZDOTDIR:-$HOME}/.zshenv $XDG_CONFIG_HOME/zsh/.zshrc $XDG_CONFIG_HOME/zsh/.zshenv"
    ;;
    bash)
        config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
    ;;
    ash)
        config_files="$HOME/.ashrc $HOME/.profile /etc/profile"
    ;;
    sh)
        config_files="$HOME/.ashrc $HOME/.profile /etc/profile"
    ;;
    *)
        # Default case if none of the above matches
        config_files="$HOME/.bashrc $HOME/.bash_profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
    ;;
esac

if [[ "$no_modify_path" != "true" ]]; then
    config_file=""
    for file in $config_files; do
        if [[ -f $file ]]; then
            config_file=$file
            break
        fi
    done

    if [[ -z $config_file ]]; then
        print_message warning "No config file found for $current_shell. You may need to manually add to PATH:"
        print_message info "  export PATH=\"$INSTALL_DIR:\$PATH\""
    elif [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        case $current_shell in
            fish)
                add_to_path "$config_file" "fish_add_path \"$INSTALL_DIR\""
            ;;
            zsh)
                add_to_path "$config_file" "export PATH=\"$INSTALL_DIR:\$PATH\""
            ;;
            bash)
                add_to_path "$config_file" "export PATH=\"$INSTALL_DIR:\$PATH\""
            ;;
            ash)
                add_to_path "$config_file" "export PATH=\"$INSTALL_DIR:\$PATH\""
            ;;
            sh)
                add_to_path "$config_file" "export PATH=\"$INSTALL_DIR:\$PATH\""
            ;;
            *)
                print_message warning "Manually add the directory to $config_file (or similar):"
                print_message info "  export PATH=\"$INSTALL_DIR:\$PATH\""
            ;;
        esac
    fi
fi

# Update PATH for current session
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    export PATH="$INSTALL_DIR:$PATH"
fi

if [ -n "${GITHUB_ACTIONS-}" ] && [ "${GITHUB_ACTIONS}" == "true" ]; then
    echo "$INSTALL_DIR" >> $GITHUB_PATH
    print_message info "Added $INSTALL_DIR to \$GITHUB_PATH"
fi

echo -e ""
printf " _____ __  __ ____  _____ ____  ____  _____ ____  \n"
printf "| ____|  \\/  | __ )| ____|  _ \\|  _ \\| ____|  _ \\ \n"
printf "|  _| | |\\/| |  _ \\|  _| | | | | | | |  _| | |_) |\n"
printf "| |___| |  | | |_) | |___| |_| | |_| | |___|  _ < \n"
printf "|_____|_|  |_|____/|_____|____/|____/|_____|_| \\_\\\\\n"
echo -e ""
echo -e ""
echo -e "${GREEN}Installation complete!${NC}"
echo -e ""
echo -e "${BOLD}Open a new terminal, then:${NC}"
echo -e ""
echo -e "  ${BOLD}cd your-project${NC}"
echo -e "  ${BOLD}embedder${NC}"
echo -e ""
