# Scene 🔗

Scene é um aplicativo React Native projetado para exploração urbana, check-ins interativos, bate-papo em tempo real e sistema de party com convites integrados.

## 🚀 Arquitetura do Projeto

O projeto é estruturado como um monorepo contendo:

- **/backend**: API REST e Socket.io em Node.js com Express e MongoDB (Mongoose).
- **/frontend**: Aplicativo mobile em React Native utilizando Zustand para gerenciamento de estado e Tailwind/CSS customizado para estilização premium.

## 🛠️ Como Iniciar o Projeto

### Pré-requisitos
- Docker & Docker Compose
- Node.js (v18+)

### Inicialização
Para rodar toda a infraestrutura de desenvolvimento (banco de dados e servidores), execute o comando a partir da pasta raiz:

```bash
docker-compose up -d
```

O backend estará ativo na porta `4000` (mapeada para a porta interna 3000).

Para rodar o aplicativo mobile:
1. Navegue até a pasta `frontend`.
2. Execute `npm run android` ou `npm run ios`.

## 🧪 Testes
Para executar as suítes de testes unitários do frontend:
```bash
docker exec -it scene-frontend npx jest
```
