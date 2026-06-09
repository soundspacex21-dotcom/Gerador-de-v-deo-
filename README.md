# Music Video AI 🎵

Site que gera vídeos para músicas usando IA (Replicate API) + Netlify.

## Como fazer o deploy

### 1. Obter a chave do Replicate

- Acesse [replicate.com](https://replicate.com) e crie uma conta
- Vá em **Account → API Tokens** e crie um token
- Copie o valor (começa com `r8_...`)

### 2. Subir para o GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/music-video-ai.git
git push -u origin main
```

### 3. Deploy no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em **Add new site → Import an existing project**
3. Conecte seu repositório do GitHub
4. Deixe as configurações de build padrão e clique em **Deploy**

### 4. Configurar a variável de ambiente

No painel do Netlify, acesse:
**Site settings → Environment variables → Add a variable**

```
Key:   REPLICATE_API_TOKEN
Value: r8_xxxxxxxxxxxxxxxxxxxx
```

Depois vá em **Deploys → Trigger deploy** para aplicar.

---

## Estrutura do projeto

```
music-video-app/
├── index.html                    ← Frontend (interface do usuário)
├── netlify.toml                  ← Configuração do Netlify
└── netlify/
    └── functions/
        ├── generate.js           ← Recebe o áudio, inicia geração no Replicate
        └── poll.js               ← Consulta o status da geração
```

## Como funciona

1. O usuário faz upload de um arquivo de áudio (MP3, WAV, M4A)
2. O frontend envia o áudio + prompt para a Netlify Function `generate`
3. A função faz upload do áudio para o Replicate e inicia a geração de vídeo
4. O frontend consulta a função `poll` a cada 5 segundos até o vídeo ficar pronto
5. O vídeo aparece na tela e fica disponível para download

## Modelos disponíveis

| Modelo | Descrição |
|--------|-----------|
| Zeroscope V2 XL | Melhor qualidade geral, recomendado |
| AnimateDiff | Bom para estilos artísticos |
| Stable Video Diffusion | Focado em movimento suave |

## Custo estimado (Replicate)

- Zeroscope V2 XL: ~$0.05 a $0.15 por vídeo de 8 segundos
- Replicate oferece créditos gratuitos para novos usuários
