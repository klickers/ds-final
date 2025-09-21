// import-csv.ts
import fs from "fs"
import csv from "csv-parser"
import { createClient } from "@libsql/client"

const db = createClient({
	url: "",
	authToken: "",
})

const BATCH_SIZE = 100
let buffer: {
	row_index: number
	q35: string
	q358077: string
	q179268: string
	q41: string
	q44639: string
	q41953: string
	q35660: string
	gender: string
	gender2: string
	d_religion_type: string
	d_drugs: string
	q20930: string
	q16053: string
	lf_want: string
	q9688: string
	d_age: number
}[] = []
const insertPromises: Promise<any>[] = []

function flush() {
	if (!buffer.length) return
	const args = buffer.flatMap((r) => [
		r.row_index,
		r.q35,
		r.q358077,
		r.q179268,
		r.q41,
		r.q44639,
		r.q41953,
		r.q35660,
		r.gender,
		r.gender2,
		r.d_religion_type,
		r.d_drugs,
		r.q20930,
		r.q16053,
		r.lf_want,
		r.q9688,
		r.d_age,
	])
	const placeholders = buffer
		.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
		.join(", ")
	insertPromises.push(
		db
			.execute({
				sql: `INSERT INTO GuesserProfile (
                            row_index,
                            q35,
                            q358077,
                            q179268,
                            q41,
                            q44639,
                            q41953,
                            q35660,
                            gender,
                            gender2,
                            d_religion_type,
                            d_drugs,
                            q20930,
                            q16053,
                            lf_want,
                            q9688,
                            d_age
                        ) 
                    VALUES ${placeholders}`,
				args,
			})
			.catch((e) => console.error("Insert failed:", e))
	)
	buffer = []
}

fs.createReadStream("../public/data/profiles_for_processing.csv")
	.pipe(csv())
	.on("data", (row) => {
		if (row.d_age == "NA") return
		buffer.push({
			row_index: Number(row.row_index),
			q35: row.q35 ?? null,
			q358077: row.q358077 ?? null,
			q179268: row.q179268 ?? null,
			q41: row.q41 ?? null,
			q44639: row.q44639 ?? null,
			q41953: row.q41953 ?? null,
			q35660: row.q35660 ?? null,
			gender: row.gender ?? null,
			gender2: row.gender2 ?? null,
			d_religion_type: row.d_religion_type ?? null,
			d_drugs: row.d_drugs ?? null,
			q20930: row.q20930 ?? null,
			q16053: row.q16053 ?? null,
			lf_want: row.lf_want ?? null,
			q9688: row.q9688 ?? null,
			d_age: Number(row.d_age),
		})
		if (buffer.length >= BATCH_SIZE) flush()
	})
	.on("end", async () => {
		flush() // flush any remaining rows
		await Promise.all(insertPromises)
		console.log("✅ CSV import complete")
		db.close()
	})
