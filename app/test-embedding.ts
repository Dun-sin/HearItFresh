
import { pipeline } from "@huggingface/transformers"
async function main() {
  try {

const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")

const output = await extractor("your lyrics here", { pooling: "mean", normalize: true })
const embedding = Array.from(output.data) as number[]

console.log(embedding.length) // should be 384
  } catch (error) {
    console.error("Error fetching embedding:", error)
  }
}
main()

