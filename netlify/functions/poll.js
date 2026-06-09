const https = require("https");

exports.handler = async (event) => {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "REPLICATE_API_TOKEN não configurado." }),
    };
  }

  const predictionId = event.queryStringParameters?.id;
  if (!predictionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "ID da predição não informado." }),
    };
  }

  try {
    const prediction = await getPrediction(predictionId, REPLICATE_API_TOKEN);

    if (prediction.status === "succeeded") {
      // O output pode ser uma URL ou array de URLs
      const output = prediction.output;
      const videoUrl = Array.isArray(output) ? output[0] : output;

      return {
        statusCode: 200,
        body: JSON.stringify({ status: "succeeded", videoUrl }),
      };
    }

    if (prediction.status === "failed") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "failed",
          error: prediction.error || "Geração falhou no Replicate.",
        }),
      };
    }

    // still processing
    return {
      statusCode: 200,
      body: JSON.stringify({ status: prediction.status }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function getPrediction(id, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.replicate.com",
      path: "/v1/predictions/" + id,
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Resposta inválida do Replicate"));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}
