FROM node:18-bullseye

# Instala Java JDK 17 e ferramentas do sistema
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    unzip \
    wget \
    jq \
    bash \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Configura as variáveis de ambiente do Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

# Cria os diretórios e instala as ferramentas de linha de comando do Android (cmdline-tools)
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip

# Aceita os termos de licença do Android e instala a plataforma/ferramentas de compilação
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

WORKDIR /app
