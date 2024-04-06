import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";
import axios from "axios";

const getSafeScoreOfImage = async (IMAGE_URL) => {
  const PAT = process.env.CLARIFAI_PAT_KEY;
  const USER_ID = process.env.CLARIFAI_USER_ID;
  const APP_ID = process.env.CLARIFAI_APP_ID;
  const MODEL_ID = process.env.CLARIFAI_MODEL_ID;
  const MODEL_VERSION_ID = process.env.CLARIFAI_MODEL_VERSION_ID;
  const stub = ClarifaiStub.grpc();

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Key " + PAT);

  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        user_app_id: {
          user_id: USER_ID,
          app_id: APP_ID,
        },
        model_id: MODEL_ID,
        version_id: MODEL_VERSION_ID,
        inputs: [
          { data: { image: { url: IMAGE_URL, allow_duplicate_url: true } } },
        ],
      },
      metadata,
      (err, response) => {
        if (err) {
          console.log("Error: " + err);
          reject(err);
        }

        if (response.status.code !== 10000) {
          console.log(
            "Received failed status: " +
              response.status.description +
              "\n" +
              response.status.details
          );
          reject(response.status.description);
        }

        const output = response.outputs[0];

        if (output.data.concepts.length === 0) {
          console.log("No concepts found in response");
          reject("No concepts found in response");
        }

        const safeScore = output.data.concepts.find(
          (concept) => concept.name === "sfw"
        )?.value || output.data.concepts[0].value || 0;

        resolve(safeScore);
      }
    );
  });
};

export { getSafeScoreOfImage };
