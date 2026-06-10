const https = require("https");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
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

  const { prompt, duration, fps } = body;

  const input = {
    prompt: prompt || "synthwave music video, cinematic",
    num_frames: Math.min((duration || 8) * (fps || 16), 200),
    fps: fps || 16,
    width: 576,
    height: 320,
    num_inference_steps: 50,
  };

  try {
    const prediction = await createPrediction(input, REPLICATE_API_TOKEN);
    return {
      statusCode: 200,
      body: JSON.stringify({ predictionId: prediction.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function createPrediction(input, token) {
  const payload = JSON.stringify({
    version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
    input,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.replicate.com",
      path: "/v1/predictions",
      method: "POST",
      headers: {
        Authorization: "Token " + token,
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
          if (json.id) resolve(json);
          else reject(new Error(json.detail || JSON.stringify(json)));
        } catch {
          reject(new Error("Resposta inválida: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
        }
