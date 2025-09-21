// update-enhanced-age.ts
import fs from "fs"
import csv from "csv-parser"
import { createClient } from "@libsql/client"

const db = createClient({
	url: "",
	authToken: "",
})

const BATCH_SIZE = 100
let buffer: { row_index: number; predicted_age: number }[] = []
const updatePromises: Promise<any>[] = []

function flush() {
	if (!buffer.length) return
	// Build a single SQL statement with multiple CASE expressions for efficiency
	const ids = buffer.map((r) => r.row_index)
	const cases = buffer
		.map((r) => `WHEN ${r.row_index} THEN ${r.predicted_age}`)
		.join(" ")

	const sql = `
    UPDATE GuesserProfile
    SET enhanced_predicted_age = CASE row_index
      ${cases}
    END
    WHERE row_index IN (${ids.join(",")})
  `

	updatePromises.push(
		db.execute(sql).catch((e) => console.error("Update failed:", e))
	)
	buffer = []
}

fs.createReadStream("../public/data/simple_enhanced_model_200_predictions.csv")
	.pipe(csv())
	.on("data", (row) => {
		// Ensure predicted_age is numeric and skip if missing
		if (!row.predicted_age || row.predicted_age === "NA") return
		buffer.push({
			row_index: Number(row.row_index),
			predicted_age: Number(row.predicted_age),
		})
		if (buffer.length >= BATCH_SIZE) flush()
	})
	.on("end", async () => {
		flush() // any remaining rows
		await Promise.all(updatePromises)
		console.log("✅ enhanced_predicted_age updates complete")
		db.close()
	})
