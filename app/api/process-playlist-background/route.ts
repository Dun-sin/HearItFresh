import { processSong } from "@/app/lib/processSong"

export const maxDuration = 800

export async function POST(req: Request) {
  const { songs } = await req.json()
  
  // return immediately so the caller isn't waiting
  const response = new Response(JSON.stringify({ started: true }), { status: 202 })
  
  // do all the heavy lifting after response is sent
  for (const song of songs) {
    await processSong(song)
  }
  
  return response
}