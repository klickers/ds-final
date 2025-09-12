// import-csv.ts
import fs from "fs"
import csv from "csv-parser"
import { createClient } from "@libsql/client"

const db = createClient({
	url: "libsql://okcupid-cathzchen.aws-eu-west-1.turso.io",
	authToken:
		"eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTc3MTY1MjIsImlkIjoiNzBmNWI5MGQtZjQ5NS00NjdlLWIzYTEtMGM4ZmE4MDAxYmNhIiwicmlkIjoiNzBiMWNlYTEtOTIyNy00ZjljLWJlYTctMmNjZGQ3NzQ5NWI1In0.jez2o9kSNfkcqcvBj28UQQEY206jML951aGz00Qq5r9SawjNaPtNw5boXdj3tNIoWzjj0f-4l2Z0ZuOtJ7AWCA",
})

const BATCH_SIZE = 100
let buffer: { age: number; q35: string; q63114: string }[] = []
const insertPromises: Promise<any>[] = []

function flush() {
	if (!buffer.length) return
	const args = buffer.flatMap((r) => [r.age, r.q35, r.q63114])
	const placeholders = buffer.map(() => "(?, ?, ?)").join(", ")
	insertPromises.push(
		db
			.execute({
				sql: `INSERT INTO UserProfile (age, q35, q63114) VALUES ${placeholders}`,
				args,
			})
			.catch((e) => console.error("Insert failed:", e))
	)
	buffer = []
}

fs.createReadStream("../public/data/user_data_public.csv")
	.pipe(csv())
	.on("data", (row) => {
		if (row.d_age == "NA") return
		buffer.push({
			age: Number(row.d_age),
			q35: row.q35 ?? null,
			q63114: row.q63114 ?? null,
		})
		if (buffer.length >= BATCH_SIZE) flush()
	})
	.on("end", async () => {
		flush() // flush any remaining rows
		await Promise.all(insertPromises)
		console.log("✅ CSV import complete")
		db.close()
	})
