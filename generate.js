const https = require("https");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "REPLICATE_API_TOKEN não configurado." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Body inválido." }) };
  }

  const { audioBase64, audioName, prompt, duration, fps, model } = body;

  if (!audioBase64 || !prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "audioBase64 e prompt são obrigatórios." }),
    };
  }

  // Primeiro, fazemos upload do áudio para o Replicate File Storage
  let audioUrl;
  try {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const ext = (audioName || "audio.mp3").split(".").pop();
    const mimeType =
      ext === "wav" ? "audio/wav" : ext === "m4a" ? "audio/m4a" : "audio/mpeg";

    audioUrl = await uploadFileToReplicate(
      audioBuffer,
      mimeType,
      REPLICATE_API_TOKEN
    );
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha no upload do áudio: " + err.message }),
    };
  }

  // Monta o input de acordo com o modelo escolhido
  const modelInputs = {
    "anotherjesse/zeroscope-v2-xl": {
      prompt: prompt,
      num_frames: Math.min(duration * fps, 200),
      fps: fps,
      width: 1024,
      height: 576,
    },
    "lucataco/animate-diff": {
      prompt: prompt,
      num_frames: Math.min(duration * fps, 128),
    },
    "stability-ai/stable-video-diffusion": {
      input_image: null, // este modelo precisa de imagem; tratado como fallback
      motion_bucket_id: 127,
    },
  };

  const input = modelInputs[model] || modelInputs["anotherjesse/zeroscope-v2-xl"];
  input.audio_url = audioUrl;

  // Cria a predição no Replicate
  try {
    const prediction = await createPrediction(model, input, REPLICATE_API_TOKEN);
    return {
      statusCode: 200,
      body: JSON.stringify({ predictionId: prediction.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao criar predição: " + err.message }),
    };
  }
};

function uploadFileToReplicate(buffer, mimeType, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.replicate.com",
      path: "/v1/files",
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": mimeType,
        "Content-Length": buffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.urls && json.urls.get) {
            resolve(json.urls.get);
          } else {
            reject(new Error(json.detail || "Upload falhou"));
          }
        } catch {
          reject(new Error("Resposta inválida do Replicate"));
        }
      });
    });

    req.on("error", reject);
    req.write(buffer);
    req.end();
  });
}

function createPrediction(model, input, token) {
  const payload = JSON.stringify({ model, input });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.replicate.com",
      path: "/v1/predictions",
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.id) {
            resolve(json);
          } else {
            reject(new Error(json.detail || JSON.stringify(json)));
          }
        } catch {
          reject(new Error("Resposta inválida do Replicate"));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}
