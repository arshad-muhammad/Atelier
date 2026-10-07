import ImageKit from "@imagekit/nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint || publicKey.includes("your_imagekit_") || privateKey.includes("your_imagekit_") || urlEndpoint.includes("your_imagekit_")) {
      return NextResponse.json({ 
        error: "ImageKit credentials are not properly configured in the .env file." 
      }, { status: 500 });
    }

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
