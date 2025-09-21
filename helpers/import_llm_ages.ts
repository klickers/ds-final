// update-llm-ages.ts
import fs from "fs"
import csv from "csv-parser"
import { createClient } from "@libsql/client"

const db = createClient({
	url: "libsql://okcupid-cathzchen.aws-eu-west-1.turso.io",
	authToken:
		"eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTg0NTYzNTMsImlkIjoiNzBmNWI5MGQtZjQ5NS00NjdlLWIzYTEtMGM4ZmE4MDAxYmNhIiwicmlkIjoiNzBiMWNlYTEtOTIyNy00ZjljLWJlYTctMmNjZGQ3NzQ5NWI1In0.A1q5mrXc5jftv37fK4mklJRXyZAZuQ31KidM3hg07rkkV9gg3Q2hEdd_w38zmVSPxJEiJVlloZshfQEQCFkhBg",
})

const BATCH_SIZE = 100
type RowBuf = { row_index: number; predicted_age: number; explanation: string }
let buffer: RowBuf[] = []
const updatePromises: Promise<any>[] = []

function flush() {
	if (!buffer.length) return

	// Build CASE expressions for each column
	const ids = buffer.map((r) => r.row_index)
	const ageCases = buffer
		.map((r) => `WHEN ${r.row_index} THEN ${r.predicted_age}`)
		.join(" ")
	const explanationCases = buffer
		.map((r) => `WHEN ${r.row_index} THEN ?`)
		.join(" ")

	// Arguments only needed for the explanation strings
	const args = buffer.map((r) => r.explanation)

	const sql = `
    UPDATE GuesserProfile
    SET
      llm_predicted_age = CASE row_index
        ${ageCases}
      END,
      llm_predicted_explanation = CASE row_index
        ${explanationCases}
      END
    WHERE row_index IN (${ids.join(",")})
  `

	updatePromises.push(
		db
			.execute({ sql, args })
			.catch((e) => console.error("Update failed:", e))
	)
	buffer = []
}

fs.createReadStream("../public/data/llm_predicted_ages_v3_with_diff.csv")
	.pipe(csv())
	.on("data", (row) => {
		if (!row.predicted_age || row.predicted_age === "NA") return
		buffer.push({
			row_index: Number(row.row_index),
			predicted_age: Number(row.predicted_age),
			explanation: row.explanation ?? "",
		})
		if (buffer.length >= BATCH_SIZE) flush()
	})
	.on("end", async () => {
		flush()
		await Promise.all(updatePromises)
		console.log(
			"✅ llm_predicted_age & llm_predicted_explanation updates complete"
		)
		db.close()
	})
