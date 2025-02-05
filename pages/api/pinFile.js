// /pages/api/pinFile.js
import axios from "axios";
import FormData from "form-data";

// Increase the body size limit to 10mb
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  console.log("API /api/pinFile called");

  if (req.method !== "POST") {
    console.error("Method not allowed");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Expecting the client to send fileName, fileData (base64), and fileType in the request body
    const { fileName, fileData, fileType } = req.body;
    console.log("Received fileName:", fileName, "fileType:", fileType);

    if (!fileName || !fileData || !fileType) {
      console.error("Missing file data");
      return res.status(400).json({ error: "Missing file data" });
    }

    // Convert the base64 string to a Buffer
    const buffer = Buffer.from(fileData, "base64");
    console.log("Converted file to Buffer, length:", buffer.length);

    // Create a FormData instance and append the file
    const form = new FormData();
    form.append("file", buffer, { filename: fileName, contentType: fileType });

    // Pinata API endpoint for file uploads
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

    // Use your provided Pinata API credentials
    const pinataApiKey = "1f7527124a3ac8497079";
    const pinataSecretApiKey = "20794ff3d4fd5fd46964df56e58799d0d30083ac3288353bea54bb5c7ea9d272";

    console.log("Uploading file to Pinata...");
    const response = await axios.post(url, form, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000, // 120 second timeout
      headers: {
        ...form.getHeaders(),
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });

    console.log("Pinata response:", response.data);
    const { IpfsHash } = response.data;
    if (!IpfsHash) {
      console.error("No IpfsHash found in Pinata response:", response.data);
      return res.status(500).json({ error: "File upload did not return an IpfsHash" });
    }
    return res.status(200).json({ cid: IpfsHash });
  } catch (error) {
    console.error("Error in /api/pinFile:", error.response ? error.response.data : error.message);
    return res.status(500).json({ error: "File upload failed" });
  }
}
