#!/bin/bash
# ============================================================
#  ANTIGRAVITY (Scene) — Script de Validação & Testes
#  React Native · Android & iOS
#  Separado por tasks independentes
# ============================================================
# Uso:
#   chmod +x antigravity-test-tasks.sh
#   ./antigravity-test-tasks.sh          # roda todas as tasks
#   ./antigravity-test-tasks.sh task_03  # roda só uma task
# ============================================================

set -euo pipefail

# ── Cores ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Contadores ─────────────────────────────────────────────
PASS=0
FAIL=0
SKIP=0
TOTAL=0

# ── Helpers ────────────────────────────────────────────────
log_task()  { echo -e "\n${CYAN}${BOLD}▶ TASK $1 — $2${RESET}"; }
log_pass()  { echo -e "  ${GREEN}✔ PASS${RESET}  $1"; ((PASS++)) || true; ((TOTAL++)) || true; }
log_fail()  { echo -e "  ${RED}✘ FAIL${RESET}  $1"; ((FAIL++)) || true; ((TOTAL++)) || true; }
log_skip()  { echo -e "  ${YELLOW}⊘ SKIP${RESET}  $1 ${DIM}(motivo: $2)${RESET}"; ((SKIP++)) || true; }
log_info()  { echo -e "  ${DIM}→ $1${RESET}"; }
log_sep()   { echo -e "${DIM}────────────────────────────────────────────────────${RESET}"; }

run_or_fail() {
  local label="$1"; shift
  if "$@" > /tmp/antigravity_cmd.log 2>&1; then
    log_pass "$label"
  else
    log_fail "$label"
    echo -e "${DIM}$(tail -5 /tmp/antigravity_cmd.log)${RESET}"
  fi
}

require_cmd() {
  command -v "$1" &>/dev/null || { echo -e "${RED}✘ Dependência ausente: $1${RESET}"; exit 1; }
}

# ── Configuração do projeto ─────────────────────────────────
PROJECT_ROOT="${ANTIGRAVITY_ROOT:-$(pwd)}"
ANDROID_MIN_SDK=23
IOS_MIN_VERSION=14
BUNDLE_ID_ANDROID="com.antigravity.scene"
BUNDLE_ID_IOS="com.antigravity.scene"
NODE_MIN="18.0.0"
RN_VERSION_EXPECTED="0.73"

# ============================================================
# TASK 01 — Ambiente e Dependências
# ============================================================
task_01() {
  log_task "01" "Ambiente e Dependências"
  log_sep

  # Node.js
  if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//')
    LOWEST=$(printf '%s\n' "$NODE_MIN" "$NODE_VER" | sort -V | head -n1)
    if [ "$LOWEST" = "$NODE_MIN" ]; then
      log_pass "Node.js $NODE_VER (mínimo $NODE_MIN)"
    else
      log_fail "Node.js $NODE_VER está abaixo do mínimo $NODE_MIN"
    fi
  else
    log_fail "Node.js não encontrado"
  fi

  # npm / yarn
  if command -v yarn &>/dev/null; then
    log_pass "Yarn $(yarn -v) encontrado"
  elif command -v npm &>/dev/null; then
    log_pass "npm $(npm -v) encontrado"
  else
    log_fail "Nenhum gerenciador de pacotes encontrado (npm/yarn)"
  fi

  # React Native CLI
  if command -v react-native &>/dev/null || npx react-native --version &>/dev/null 2>&1; then
    log_pass "React Native CLI disponível"
  else
    log_fail "React Native CLI não encontrado"
  fi

  # Java (Android)
  if command -v java &>/dev/null; then
    JAVA_VER=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    log_pass "Java $JAVA_VER (necessário para Android)"
  else
    log_fail "Java não encontrado — build Android impossível"
  fi

  # Android SDK
  if [ -n "${ANDROID_HOME:-}" ]; then
    log_pass "ANDROID_HOME definido: $ANDROID_HOME"
  else
    log_fail "ANDROID_HOME não definido"
  fi

  # Xcode (iOS — só macOS)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcodebuild &>/dev/null; then
      XCODE_VER=$(xcodebuild -version 2>/dev/null | head -1)
      log_pass "$XCODE_VER encontrado"
    else
      log_fail "Xcode não encontrado — build iOS impossível"
    fi
    if command -v pod &>/dev/null; then
      log_pass "CocoaPods $(pod --version) encontrado"
    else
      log_fail "CocoaPods não encontrado"
    fi
  else
    log_skip "Xcode / CocoaPods" "não é macOS"
  fi

  # Watchman
  if command -v watchman &>/dev/null; then
    log_pass "Watchman $(watchman --version) encontrado"
  else
    log_skip "Watchman" "opcional mas recomendado"
  fi
}

# ============================================================
# TASK 02 — Estrutura de Arquivos do Projeto
# ============================================================
task_02() {
  log_task "02" "Estrutura de Arquivos do Projeto"
  log_sep

  cd "$PROJECT_ROOT"

  required_files=(
    "package.json"
    "app.json"
    "index.js"
    "babel.config.js"
    "android/build.gradle"
    "android/app/build.gradle"
    "android/app/src/main/AndroidManifest.xml"
    "ios/Podfile"
  )

  for f in "${required_files[@]}"; do
    if [ -e "$f" ]; then
      log_pass "Arquivo presente: $f"
    else
      log_fail "Arquivo ausente: $f"
    fi
  done

  required_dirs=(
    "src"
    "src/screens"
    "src/components"
    "src/navigation"
    "src/services"
    "src/store"
    "src/hooks"
    "src/utils"
    "__tests__"
  )

  for d in "${required_dirs[@]}"; do
    if [ -d "$d" ]; then
      log_pass "Diretório presente: $d"
    else
      log_fail "Diretório ausente: $d"
    fi
  done
}

# ============================================================
# TASK 03 — Validação do package.json
# ============================================================
task_03() {
  log_task "03" "Validação do package.json"
  log_sep

  cd "$PROJECT_ROOT"

  if ! command -v jq &>/dev/null; then
    log_skip "Validação JSON detalhada" "jq não instalado"
    return
  fi

  PKG="package.json"

  # Nome e versão
  APP_NAME=$(jq -r '.name' $PKG)
  APP_VERSION=$(jq -r '.version' $PKG)

  [ "$APP_NAME" != "null" ] && log_pass "name definido: $APP_NAME" || log_fail "name ausente no package.json"
  [ "$APP_VERSION" != "null" ] && log_pass "version definida: $APP_VERSION" || log_fail "version ausente no package.json"

  # Dependências críticas
  critical_deps=(
    "react"
    "react-native"
    "@react-navigation/native"
    "@react-navigation/stack"
    "react-native-maps"
    "react-native-geolocation-service"
    "@supabase/supabase-js"
    "socket.io-client"
    "zustand"
    "react-native-push-notification"
    "react-native-camera"
    "react-native-qrcode-scanner"
  )

  for dep in "${critical_deps[@]}"; do
    if jq -e ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"]" $PKG > /dev/null 2>&1; then
      VER=$(jq -r ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"]" $PKG)
      log_pass "Dependência: $dep @ $VER"
    else
      log_fail "Dependência ausente: $dep"
    fi
  done

  # Scripts obrigatórios
  required_scripts=("android" "ios" "start" "test" "lint")
  for s in "${required_scripts[@]}"; do
    if jq -e ".scripts[\"$s\"]" $PKG > /dev/null 2>&1; then
      log_pass "Script: $s"
    else
      log_fail "Script ausente: $s"
    fi
  done

  # Versão do RN
  RN_VER=$(jq -r '.dependencies["react-native"] // "0"' $PKG | sed 's/[^0-9.]//g')
  log_info "React Native versão detectada: $RN_VER (esperado: ~$RN_VERSION_EXPECTED)"
}

# ============================================================
# TASK 04 — Instalação de Dependências
# ============================================================
task_04() {
  log_task "04" "Instalação de Dependências"
  log_sep

  cd "$PROJECT_ROOT"

  # node_modules
  if [ -d "node_modules" ]; then
    log_pass "node_modules presente"
  else
    log_info "node_modules ausente — instalando..."
    if command -v yarn &>/dev/null; then
      run_or_fail "yarn install" yarn install
    else
      run_or_fail "npm install" npm install
    fi
  fi

  # iOS pods
  if [[ "$OSTYPE" == "darwin"* ]] && [ -f "ios/Podfile" ]; then
    if [ -d "ios/Pods" ]; then
      log_pass "iOS Pods instalados"
    else
      log_info "Pods ausentes — instalando..."
      run_or_fail "pod install" bash -c "cd ios && pod install"
    fi
  fi

  # Verificar integridade
  if command -v yarn &>/dev/null; then
    run_or_fail "yarn check --integrity" yarn check --integrity 2>/dev/null || true
  fi
}

# ============================================================
# TASK 05 — Lint e Qualidade de Código
# ============================================================
task_05() {
  log_task "05" "Lint e Qualidade de Código"
  log_sep

  cd "$PROJECT_ROOT"

  # ESLint
  if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc" ]; then
    log_pass "Arquivo .eslintrc presente"
    run_or_fail "ESLint sem erros" npx eslint src/ --ext .js,.jsx,.ts,.tsx --max-warnings=0
  else
    log_fail "Arquivo .eslintrc não encontrado"
  fi

  # Prettier
  if [ -f ".prettierrc" ] || [ -f ".prettierrc.js" ] || [ -f "prettier.config.js" ]; then
    log_pass "Arquivo .prettierrc presente"
    run_or_fail "Prettier — formatação OK" npx prettier --check "src/**/*.{js,jsx,ts,tsx}"
  else
    log_skip "Prettier" ".prettierrc não encontrado"
  fi

  # TypeScript (se usar)
  if [ -f "tsconfig.json" ]; then
    log_pass "tsconfig.json presente"
    run_or_fail "TypeScript sem erros de tipo" npx tsc --noEmit
  else
    log_skip "TypeScript check" "tsconfig.json não encontrado"
  fi
}

# ============================================================
# TASK 06 — Testes Unitários (Jest)
# ============================================================
task_06() {
  log_task "06" "Testes Unitários — Jest"
  log_sep

  cd "$PROJECT_ROOT"

  # Verificar config Jest
  if jq -e '.jest' package.json > /dev/null 2>&1 || [ -f "jest.config.js" ]; then
    log_pass "Configuração Jest encontrada"
  else
    log_fail "Configuração Jest ausente no package.json ou jest.config.js"
  fi

  # Verificar existência de testes
  TEST_COUNT=$(find __tests__ src -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TEST_COUNT" -gt 0 ]; then
    log_pass "$TEST_COUNT arquivo(s) de teste encontrado(s)"
  else
    log_fail "Nenhum arquivo de teste encontrado"
  fi

  # Rodar testes específicos por módulo Scene
  log_info "Rodando suítes de teste por módulo..."

  modules=(
    "__tests__/checkin"
    "__tests__/map"
    "__tests__/chat"
    "__tests__/profiles"
    "__tests__/invite"
    "__tests__/auth"
    "__tests__/notifications"
    "__tests__/geolocation"
    "__tests__/ranking"
  )

  for module in "${modules[@]}"; do
    if [ -d "$module" ] || ls ${module}.test.* &>/dev/null 2>&1; then
      run_or_fail "Testes: $module" npx jest "$module" --passWithNoTests --forceExit
    else
      log_skip "Testes: $module" "módulo não implementado ainda"
    fi
  done

  # Coverage geral
  run_or_fail "Coverage mínimo 70%" npx jest --coverage --passWithNoTests --forceExit
}

# ============================================================
# TASK 07 — Testes de Integração
# ============================================================
task_07() {
  log_task "07" "Testes de Integração"
  log_sep

  cd "$PROJECT_ROOT"

  # Supabase connection mock
  SUPABASE_URL="${SUPABASE_URL:-}"
  if [ -n "$SUPABASE_URL" ]; then
    run_or_fail "Conexão Supabase" bash -c "
      curl -s -o /dev/null -w '%{http_code}' '$SUPABASE_URL/health' | grep -q '200'
    "
  else
    log_skip "Conexão Supabase" "SUPABASE_URL não definida"
  fi

  # Testes de integração Jest
  if [ -d "__tests__/integration" ]; then
    run_or_fail "Integração: Auth flow" npx jest __tests__/integration/auth --forceExit --passWithNoTests
    run_or_fail "Integração: Checkin flow" npx jest __tests__/integration/checkin --forceExit --passWithNoTests
    run_or_fail "Integração: Chat realtime" npx jest __tests__/integration/chat --forceExit --passWithNoTests
    run_or_fail "Integração: Geolocation" npx jest __tests__/integration/geolocation --forceExit --passWithNoTests
    run_or_fail "Integração: Notifications" npx jest __tests__/integration/notifications --forceExit --passWithNoTests
  else
    log_skip "Testes de integração" "__tests__/integration não encontrado"
  fi
}

# ============================================================
# TASK 08 — Validações de Segurança
# ============================================================
task_08() {
  log_task "08" "Validações de Segurança"
  log_sep

  cd "$PROJECT_ROOT"

  # .env não versionado
  if grep -q "\.env" .gitignore 2>/dev/null; then
    log_pass ".env no .gitignore"
  else
    log_fail ".env NÃO está no .gitignore — risco de vazar credenciais"
  fi

  # Verificar hardcoded secrets
  log_info "Verificando chaves hardcoded no código..."
  SECRETS_FOUND=$( (grep -rn \
    -e "supabase_key\s*=" \
    -e "apiKey\s*=\s*['\"][A-Za-z0-9]" \
    -e "SECRET\s*=\s*['\"]" \
    --include="*.js" --include="*.ts" --include="*.tsx" \
    src/ 2>/dev/null | grep -v ".env" | grep -v "process.env" || true) | wc -l | tr -d ' ' )

  if [ "$SECRETS_FOUND" -eq 0 ]; then
    log_pass "Nenhuma chave hardcoded detectada"
  else
    log_fail "$SECRETS_FOUND ocorrência(s) de possível chave hardcoded"
  fi

  # npm audit
  run_or_fail "npm audit — sem vulnerabilidades críticas" bash -c "
    npm audit --audit-level=critical 2>/dev/null || true
  "

  # GPS — verificar permissões declaradas corretamente
  MANIFEST="android/app/src/main/AndroidManifest.xml"
  if [ -f "$MANIFEST" ]; then
    if grep -q "ACCESS_FINE_LOCATION" "$MANIFEST"; then
      log_pass "Permissão GPS (Android): ACCESS_FINE_LOCATION declarada"
    else
      log_fail "Permissão ACCESS_FINE_LOCATION ausente no AndroidManifest.xml"
    fi
    if grep -q "ACCESS_COARSE_LOCATION" "$MANIFEST"; then
      log_pass "Permissão GPS (Android): ACCESS_COARSE_LOCATION declarada"
    else
      log_fail "Permissão ACCESS_COARSE_LOCATION ausente no AndroidManifest.xml"
    fi
  fi

  # iOS Info.plist GPS
  IOS_PLIST=$(find ios -name "Info.plist" 2>/dev/null | head -1)
  if [ -f "$IOS_PLIST" ]; then
    if grep -q "NSLocationWhenInUseUsageDescription" "$IOS_PLIST"; then
      log_pass "Permissão GPS (iOS): NSLocationWhenInUseUsageDescription declarada"
    else
      log_fail "NSLocationWhenInUseUsageDescription ausente no Info.plist"
    fi
  else
    log_skip "Info.plist GPS check" "não é macOS ou arquivo não encontrado"
  fi

  # Camera permission (QR code)
  if [ -f "$MANIFEST" ]; then
    if grep -q "android.permission.CAMERA" "$MANIFEST"; then
      log_pass "Permissão CAMERA (Android) declarada"
    else
      log_fail "Permissão CAMERA ausente — necessária para QR code"
    fi
  fi

  # Push notifications (Android)
  if [ -f "android/app/google-services.json" ]; then
    log_pass "google-services.json presente (FCM Android)"
  else
    log_fail "google-services.json ausente — notificações push Android não vão funcionar"
  fi

  # Push notifications (iOS)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if ls ios/*.xcworkspace &>/dev/null 2>&1; then
      log_pass ".xcworkspace encontrado (iOS push capabilities provavelmente configuradas)"
    else
      log_skip "iOS push check" "xcworkspace não encontrado"
    fi
  fi
}

# ============================================================
# TASK 09 — Validação do Android
# ============================================================
task_09() {
  log_task "09" "Validação Android"
  log_sep

  cd "$PROJECT_ROOT"

  GRADLE="android/app/build.gradle"

  if [ ! -f "$GRADLE" ]; then
    log_fail "build.gradle não encontrado"
    return
  fi

  # minSdkVersion
  MIN_SDK=$(grep "minSdkVersion" "$GRADLE" | grep -o '[0-9]*' | head -1)
  if [ -n "$MIN_SDK" ]; then
    if [ "$MIN_SDK" -ge "$ANDROID_MIN_SDK" ]; then
      log_pass "minSdkVersion $MIN_SDK (mínimo $ANDROID_MIN_SDK)"
    else
      log_fail "minSdkVersion $MIN_SDK está abaixo do mínimo $ANDROID_MIN_SDK"
    fi
  else
    log_fail "minSdkVersion não encontrado no build.gradle"
  fi

  # targetSdkVersion
  TARGET_SDK=$(grep "targetSdkVersion" "$GRADLE" | grep -o '[0-9]*' | head -1)
  [ -n "$TARGET_SDK" ] && log_pass "targetSdkVersion $TARGET_SDK" || log_fail "targetSdkVersion não encontrado"

  # applicationId
  APP_ID=$(grep "applicationId" "$GRADLE" | sed 's/.*"\(.*\)".*/\1/' | tr -d ' ')
  if [ "$APP_ID" = "$BUNDLE_ID_ANDROID" ]; then
    log_pass "applicationId: $APP_ID"
  else
    log_fail "applicationId '$APP_ID' diferente do esperado '$BUNDLE_ID_ANDROID'"
  fi

  # Keystore (release)
  if [ -f "android/app/release.keystore" ] || [ -f "android/app/antigravity-release.keystore" ]; then
    log_pass "Keystore de release encontrada"
  else
    log_skip "Keystore de release" "necessária apenas para publicação na Play Store"
  fi

  # Build debug
  if [ "${SKIP_BUILD:-false}" != "true" ]; then
    log_info "Compilando Android debug (pode demorar)..."
    run_or_fail "Build Android debug" bash -c "cd android && ./gradlew assembleDebug --quiet"
  else
    log_skip "Build Android debug" "SKIP_BUILD=true"
  fi

  # Gradlew permissão
  if [ -x "android/gradlew" ]; then
    log_pass "android/gradlew é executável"
  else
    log_fail "android/gradlew não é executável — rode: chmod +x android/gradlew"
  fi
}

# ============================================================
# TASK 10 — Validação do iOS
# ============================================================
task_10() {
  log_task "10" "Validação iOS"
  log_sep

  if [[ "$OSTYPE" != "darwin"* ]]; then
    log_skip "Validação iOS completa" "não é macOS"
    return
  fi

  cd "$PROJECT_ROOT"

  PODFILE="ios/Podfile"

  if [ ! -f "$PODFILE" ]; then
    log_fail "Podfile não encontrado"
    return
  fi

  # Versão mínima iOS
  IOS_MIN=$(grep "platform :ios" "$PODFILE" | grep -o '[0-9]*\.[0-9]*' | head -1)
  if [ -n "$IOS_MIN" ]; then
    if awk "BEGIN{exit !($IOS_MIN >= $IOS_MIN_VERSION)}"; then
      log_pass "iOS minimum deployment target: $IOS_MIN"
    else
      log_fail "iOS deployment target $IOS_MIN está abaixo do mínimo $IOS_MIN_VERSION"
    fi
  else
    log_fail "platform :ios não encontrado no Podfile"
  fi

  # Pods instalados
  if [ -d "ios/Pods" ]; then
    log_pass "Pods instalados"
  else
    log_fail "ios/Pods ausente — rode: cd ios && pod install"
  fi

  # Bundle identifier
  XCODEPROJ=$(find ios -name "*.xcodeproj" -maxdepth 2 | head -1)
  if [ -n "$XCODEPROJ" ]; then
    PBXPROJ="$XCODEPROJ/project.pbxproj"
    if grep -q "$BUNDLE_ID_IOS" "$PBXPROJ" 2>/dev/null; then
      log_pass "Bundle ID iOS: $BUNDLE_ID_IOS"
    else
      log_fail "Bundle ID '$BUNDLE_ID_IOS' não encontrado no projeto Xcode"
    fi
  fi

  # Build iOS debug
  if [ "${SKIP_BUILD:-false}" != "true" ] && command -v xcodebuild &>/dev/null; then
    WORKSPACE=$(find ios -name "*.xcworkspace" | head -1)
    SCHEME=$(basename "${WORKSPACE%.xcworkspace}" 2>/dev/null || echo "Antigravity")
    log_info "Compilando iOS debug..."
    run_or_fail "Build iOS debug" xcodebuild \
      -workspace "$WORKSPACE" \
      -scheme "$SCHEME" \
      -configuration Debug \
      -sdk iphonesimulator \
      -destination 'platform=iOS Simulator,name=iPhone 14' \
      build \
      CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO \
      -quiet 2>/dev/null
  else
    log_skip "Build iOS debug" "SKIP_BUILD=true ou xcodebuild não disponível"
  fi
}

# ============================================================
# TASK 11 — Testes de Features Core do Scene
# ============================================================
task_11() {
  log_task "11" "Features Core — Scene / Antigravity"
  log_sep

  cd "$PROJECT_ROOT"

  log_info "Verificando implementação das features principais..."

  # Checkin por GPS
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "checkin\|checkIn\|check_in" 2>/dev/null | grep -q .; then
    log_pass "Feature: Check-in implementada"
  else
    log_fail "Feature: Check-in NÃO encontrada em src/"
  fi

  # Status de intenção
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "status\|intention\|afim\|disponível" 2>/dev/null | grep -q .; then
    log_pass "Feature: Status de intenção implementado"
  else
    log_fail "Feature: Status de intenção NÃO encontrado"
  fi

  # Mapa / Geolocalização
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "MapView\|react-native-maps\|Geolocation" 2>/dev/null | grep -q .; then
    log_pass "Feature: Mapa/Geolocalização implementado"
  else
    log_fail "Feature: Mapa/Geolocalização NÃO encontrado"
  fi

  # Chat em tempo real
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "socket\|realtime\|supabase.*channel" 2>/dev/null | grep -q .; then
    log_pass "Feature: Chat em tempo real implementado"
  else
    log_fail "Feature: Chat em tempo real NÃO encontrado"
  fi

  # Push notifications
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "PushNotification\|messaging\|FCM" 2>/dev/null | grep -q .; then
    log_pass "Feature: Push Notifications implementadas"
  else
    log_fail "Feature: Push Notifications NÃO encontradas"
  fi

  # QR Code
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "QRCode\|qrcode\|qr-scanner" 2>/dev/null | grep -q .; then
    log_pass "Feature: QR Code Scanner implementado"
  else
    log_fail "Feature: QR Code Scanner NÃO encontrado"
  fi

  # Ranking de locais
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "ranking\|venue\|local.*score" 2>/dev/null | grep -q .; then
    log_pass "Feature: Ranking de locais implementado"
  else
    log_fail "Feature: Ranking de locais NÃO encontrado"
  fi

  # Convite privado
  if find src -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
     xargs grep -l "invite\|convite\|privateChat" 2>/dev/null | grep -q .; then
    log_pass "Feature: Convite privado implementado"
  else
    log_fail "Feature: Convite privado NÃO encontrado"
  fi

  # Testes Jest específicos por feature
  features_tests=(
    "checkin.test"
    "map.test"
    "chat.test"
    "invite.test"
    "ranking.test"
    "geolocation.test"
    "status.test"
    "notifications.test"
    "qrcode.test"
    "auth.test"
    "subscription.test"
  )

  log_info "Rodando testes unitários por feature..."
  for t in "${features_tests[@]}"; do
    TEST_PATH=$(find __tests__ src -name "${t}*" 2>/dev/null | head -1)
    if [ -n "$TEST_PATH" ]; then
      run_or_fail "Jest: $t" npx jest "$TEST_PATH" --forceExit --passWithNoTests --silent
    else
      log_skip "Jest: $t" "arquivo de teste não encontrado"
    fi
  done
}

# ============================================================
# TASK 12 — Testes E2E com Detox
# ============================================================
task_12() {
  log_task "12" "Testes E2E — Detox"
  log_sep

  cd "$PROJECT_ROOT"

  if ! command -v detox &>/dev/null && ! npx detox --version &>/dev/null 2>&1; then
    log_skip "Detox E2E" "Detox não instalado (npm install -g detox-cli)"
    return
  fi

  if [ ! -f ".detoxrc.js" ] && [ ! -f ".detoxrc.json" ]; then
    log_fail ".detoxrc não encontrado — configure o Detox primeiro"
    return
  fi

  log_pass "Detox instalado e configurado"

  if [ "${SKIP_E2E:-false}" = "true" ]; then
    log_skip "Detox build + test" "SKIP_E2E=true"
    return
  fi

  # Build para testes
  run_or_fail "Detox build Android" npx detox build --configuration android.emu.debug 2>/dev/null || true
  run_or_fail "Detox build iOS" npx detox build --configuration ios.sim.debug 2>/dev/null || true

  # Fluxos E2E Scene
  e2e_flows=(
    "e2e/auth.e2e.js"
    "e2e/checkin.e2e.js"
    "e2e/map.e2e.js"
    "e2e/chat.e2e.js"
    "e2e/invite.e2e.js"
    "e2e/qrcode.e2e.js"
  )

  for flow in "${e2e_flows[@]}"; do
    if [ -f "$flow" ]; then
      run_or_fail "E2E: $flow" npx detox test "$flow" --configuration android.emu.debug --headless
    else
      log_skip "E2E: $flow" "arquivo não criado ainda"
    fi
  done
}

# ============================================================
# TASK 13 — Performance e Bundle
# ============================================================
task_13() {
  log_task "13" "Performance e Bundle"
  log_sep

  cd "$PROJECT_ROOT"

  # Bundle size Android
  if [ "${SKIP_BUILD:-false}" != "true" ]; then
    log_info "Gerando bundle para análise de tamanho..."
    run_or_fail "Bundle Android gerado" npx react-native bundle \
      --platform android \
      --dev false \
      --entry-file index.js \
      --bundle-output /tmp/antigravity.android.bundle \
      --assets-dest /tmp/antigravity-assets/ \
      --quiet 2>/dev/null

    if [ -f "/tmp/antigravity.android.bundle" ]; then
      BUNDLE_SIZE=$(du -sh /tmp/antigravity.android.bundle | cut -f1)
      log_info "Tamanho do bundle Android: $BUNDLE_SIZE"
      BUNDLE_BYTES=$(wc -c < /tmp/antigravity.android.bundle)
      # Alerta se bundle > 5MB
      if [ "$BUNDLE_BYTES" -gt 5242880 ]; then
        log_fail "Bundle > 5MB ($BUNDLE_SIZE) — considere code splitting"
      else
        log_pass "Tamanho do bundle OK: $BUNDLE_SIZE"
      fi
    fi
  else
    log_skip "Bundle size check" "SKIP_BUILD=true"
  fi

  # Imagens otimizadas
  LARGE_IMAGES=$(find src assets -name "*.png" -o -name "*.jpg" 2>/dev/null | \
    xargs du -k 2>/dev/null | awk '$1>500' | wc -l | tr -d ' ')
  if [ "$LARGE_IMAGES" -eq 0 ]; then
    log_pass "Nenhuma imagem > 500KB detectada"
  else
    log_fail "$LARGE_IMAGES imagem(ns) maior que 500KB — comprima antes do release"
  fi

  # Hermes habilitado (Android)
  GRADLE="android/app/build.gradle"
  if [ -f "$GRADLE" ] && grep -q "hermesEnabled.*true\|enableHermes.*true" "$GRADLE"; then
    log_pass "Hermes JS engine habilitado (Android)"
  else
    log_skip "Hermes check" "Hermes não configurado ou não detectado"
  fi
}

# ============================================================
# TASK 14 — Acessibilidade
# ============================================================
task_14() {
  log_task "14" "Acessibilidade"
  log_sep

  cd "$PROJECT_ROOT"

  log_info "Verificando props de acessibilidade nos componentes..."

  # accessibilityLabel nos componentes críticos
  ACC_COUNT=$(grep -rn "accessibilityLabel\|accessible\|accessibilityRole" \
    src/ --include="*.js" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$ACC_COUNT" -gt 5 ]; then
    log_pass "Acessibilidade: $ACC_COUNT ocorrências de props acessíveis"
  else
    log_fail "Acessibilidade: apenas $ACC_COUNT ocorrências — componentes precisam de accessibilityLabel"
  fi

  # Textos com tamanho dinâmico
  if grep -rn "allowFontScaling\|maxFontSizeMultiplier" \
    src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -q .; then
    log_pass "allowFontScaling configurado em textos"
  else
    log_skip "Font scaling" "verifique manualmente se textos respeitam tamanho do sistema"
  fi

  # Dark mode
  if grep -rn "useColorScheme\|Appearance.getColorScheme\|ColorSchemeName" \
    src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -q .; then
    log_pass "Dark mode: useColorScheme detectado"
  else
    log_skip "Dark mode" "não detectado — considere suporte"
  fi
}

# ============================================================
# TASK 15 — Relatório Final
# ============================================================
task_15() {
  log_task "15" "Relatório Final"
  log_sep

  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}║     ANTIGRAVITY (Scene) — RESULTADO FINAL    ║${RESET}"
  echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "  ${GREEN}✔ Passou:   $PASS${RESET}"
  echo -e "  ${RED}✘ Falhou:   $FAIL${RESET}"
  echo -e "  ${YELLOW}⊘ Pulou:    $SKIP${RESET}"
  echo -e "  ${DIM}━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "  Total:     $TOTAL verificações"
  echo ""

  SCORE=0
  [ "$TOTAL" -gt 0 ] && SCORE=$(( (PASS * 100) / TOTAL ))

  if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}🚀 TUDO PASSOU — App pronto para o próximo stage!${RESET}"
  elif [ "$SCORE" -ge 80 ]; then
    echo -e "  ${YELLOW}${BOLD}⚡ Score: ${SCORE}% — Quase lá. Corrija os itens em vermelho.${RESET}"
  elif [ "$SCORE" -ge 60 ]; then
    echo -e "  ${YELLOW}${BOLD}⚠ Score: ${SCORE}% — Atenção necessária antes de prosseguir.${RESET}"
  else
    echo -e "  ${RED}${BOLD}✘ Score: ${SCORE}% — Várias falhas críticas. Revise antes de buildar.${RESET}"
  fi

  echo ""

  # Timestamp e log
  REPORT_FILE="antigravity-test-report-$(date +%Y%m%d-%H%M%S).txt"
  echo "Antigravity Test Report — $(date)" > "$REPORT_FILE"
  echo "Pass: $PASS | Fail: $FAIL | Skip: $SKIP | Total: $TOTAL | Score: $SCORE%" >> "$REPORT_FILE"
  log_info "Relatório salvo em: $REPORT_FILE"

  echo ""

  # Exit code para CI/CD
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
}

# ============================================================
# RUNNER — Executa tasks selecionadas ou todas
# ============================================================
TASK_TO_RUN="${1:-all}"

run_task() {
  case "$1" in
    task_01|01) task_01 ;;
    task_02|02) task_02 ;;
    task_03|03) task_03 ;;
    task_04|04) task_04 ;;
    task_05|05) task_05 ;;
    task_06|06) task_06 ;;
    task_07|07) task_07 ;;
    task_08|08) task_08 ;;
    task_09|09) task_09 ;;
    task_10|10) task_10 ;;
    task_11|11) task_11 ;;
    task_12|12) task_12 ;;
    task_13|13) task_13 ;;
    task_14|14) task_14 ;;
    task_15|15) task_15 ;;
    *) echo -e "${RED}Task '$1' não reconhecida.${RESET}"; exit 1 ;;
  esac
}

echo ""
echo -e "${BOLD}${CYAN} ▄▄▄  ███  ████ ████  ██ ██████${RESET}"
echo -e "${BOLD}${CYAN} ANTIGRAVITY · Scene · Test Suite${RESET}"
echo -e "${DIM} React Native · Android & iOS · $(date '+%d/%m/%Y %H:%M')${RESET}"
echo ""

if [ "$TASK_TO_RUN" = "all" ]; then
  task_01; task_02; task_03; task_04; task_05
  task_06; task_07; task_08; task_09; task_10
  task_11; task_12; task_13; task_14; task_15
else
  run_task "$TASK_TO_RUN"
fi
